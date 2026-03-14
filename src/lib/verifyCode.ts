/**
 * 验证码验证公共模块
 */
import { query } from '@/lib/db';
import type { VerificationCode, VerifyCodeResult } from '@/types/auth';

/** 获取最近的有效验证码（需要验证码匹配） */
async function getValidCodeWithMatch(
  email: string,
  code: string,
  type: number
): Promise<VerificationCode | null> {
  const codes = await query<VerificationCode[]>(
    `SELECT id, email, code, type, expires_at, used 
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
    `SELECT id, email, code, type, expires_at, used 
     FROM email_verification_codes 
     WHERE email = ? AND type = ? AND used = 0 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email, type]
  );
  return codes[0] || null;
}

/** 标记验证码已使用 */
export async function markCodeUsed(codeId: number) {
  await query('UPDATE email_verification_codes SET used = 1 WHERE id = ?', [codeId]);
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
    return { ok: false, status: 400, error: '验证码错误或已过期', codeId: null };
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

  if (codeRecord.code !== inputCode) {
    return { ok: false, status: 400, error: '验证码错误', codeId: null };
  }

  return { ok: true, codeId: codeRecord.id };
}
