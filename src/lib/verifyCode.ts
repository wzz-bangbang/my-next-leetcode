/**
 * 验证码验证公共模块
 */
import { query } from '@/lib/db';
import type { VerificationCode, VerifyCodeResult } from '@/types/auth';

const MAX_VERIFY_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

/** 获取最近的有效验证码（需要验证码匹配） */
async function getValidCodeWithMatch(
  email: string,
  code: string,
  type: number
): Promise<VerificationCode | null> {
  const codes = await query<VerificationCode[]>(
    `SELECT id, email, code, type, verify_attempts, locked_until, expires_at, used 
     FROM email_verification_codes 
     WHERE email = ? AND code = ? AND type = ? AND used = 0 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email, code, type]
  );
  return codes[0] || null;
}

/** 获取最近的有效验证码（不需要验证码匹配，用于检查是否存在） */
async function getLatestValidCode(
  email: string,
  type: number
): Promise<VerificationCode | null> {
  const codes = await query<VerificationCode[]>(
    `SELECT id, email, code, type, verify_attempts, locked_until, expires_at, used 
     FROM email_verification_codes 
     WHERE email = ? AND type = ? AND used = 0 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email, type]
  );
  return codes[0] || null;
}

/** 增加验证码尝试次数 */
async function incrementCodeAttempts(email: string, type: number) {
  await query(
    `UPDATE email_verification_codes SET verify_attempts = verify_attempts + 1 
     WHERE email = ? AND type = ? AND used = 0`,
    [email, type]
  );
}

/** 锁定验证码 */
async function lockCode(codeId: number) {
  await query(
    `UPDATE email_verification_codes SET locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?`,
    [LOCK_DURATION_MINUTES, codeId]
  );
}

/** 标记验证码已使用 */
export async function markCodeUsed(codeId: number) {
  await query('UPDATE email_verification_codes SET used = 1 WHERE id = ?', [codeId]);
}

/** 更新验证码尝试次数和锁定状态 */
async function updateCodeAttempts(codeId: number, attempts: number, lockedUntil?: Date) {
  if (lockedUntil) {
    await query(
      'UPDATE email_verification_codes SET verify_attempts = ?, locked_until = ? WHERE id = ?',
      [attempts, lockedUntil, codeId]
    );
  } else {
    await query(
      'UPDATE email_verification_codes SET verify_attempts = ? WHERE id = ?',
      [attempts, codeId]
    );
  }
}

/**
 * 验证验证码（匹配模式）
 * 需要提供正确的验证码才能验证成功
 */
export async function verifyCodeWithMatch(
  email: string,
  inputCode: string,
  type: number
): Promise<VerifyCodeResult> {
  const codeRecord = await getValidCodeWithMatch(email, inputCode, type);

  if (!codeRecord) {
    // 验证码不匹配，增加尝试次数
    await incrementCodeAttempts(email, type);
    return { ok: false, status: 400, error: '验证码错误或已过期', codeId: null };
  }

  // 检查是否被锁定
  if (codeRecord.locked_until && new Date(codeRecord.locked_until) > new Date()) {
    return { ok: false, status: 429, error: '尝试次数过多，请30分钟后再试', codeId: null };
  }

  // 检查尝试次数
  if (codeRecord.verify_attempts >= MAX_VERIFY_ATTEMPTS) {
    await lockCode(codeRecord.id);
    return { ok: false, status: 429, error: '尝试次数过多，请30分钟后再试', codeId: null };
  }

  return { ok: true, codeId: codeRecord.id };
}

/**
 * 验证验证码（先查后验模式）
 * 先检查是否存在有效验证码，再验证是否匹配
 * 用于需要更细粒度错误提示的场景
 */
export async function verifyCodeWithCheck(
  email: string,
  inputCode: string,
  type: number
): Promise<VerifyCodeResult> {
  const codeRecord = await getLatestValidCode(email, type);

  if (!codeRecord) {
    return { ok: false, status: 400, error: '验证码已过期或不存在，请重新获取', codeId: null };
  }

  // 检查是否被锁定
  if (codeRecord.locked_until && new Date(codeRecord.locked_until) > new Date()) {
    const remainingMinutes = Math.ceil(
      (new Date(codeRecord.locked_until).getTime() - Date.now()) / 60000
    );
    return { ok: false, status: 429, error: `验证码错误次数过多，请 ${remainingMinutes} 分钟后再试`, codeId: null };
  }

  // 验证码错误
  if (codeRecord.code !== inputCode) {
    const newAttempts = (codeRecord.verify_attempts || 0) + 1;

    if (newAttempts >= MAX_VERIFY_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
      await updateCodeAttempts(codeRecord.id, newAttempts, lockedUntil);
      return { ok: false, status: 429, error: `验证码错误次数过多，已锁定 ${LOCK_DURATION_MINUTES} 分钟`, codeId: null };
    }

    await updateCodeAttempts(codeRecord.id, newAttempts);
    const remaining = MAX_VERIFY_ATTEMPTS - newAttempts;
    return { ok: false, status: 400, error: `验证码错误，还剩 ${remaining} 次尝试机会`, codeId: null };
  }

  return { ok: true, codeId: codeRecord.id };
}
