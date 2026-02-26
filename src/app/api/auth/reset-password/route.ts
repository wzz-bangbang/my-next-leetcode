import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { validateEmail, validatePasswordStrength } from '@/lib/validation';
import { CODE_TYPE } from '@/lib/email';

// ============ 类型定义 ============

interface VerificationCode {
  id: number;
  code: string;
  verify_attempts: number;
  locked_until: Date | null;
}

const MAX_VERIFY_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

// ============ 数据访问层 ============

/** 获取最近的有效验证码 */
async function getLatestValidCode(email: string): Promise<VerificationCode | null> {
  const codes = await query<VerificationCode[]>(
    `SELECT id, code, verify_attempts, locked_until FROM email_verification_codes 
     WHERE email = ? AND type = ? AND used = 0 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email, CODE_TYPE.RESET]
  );
  return codes[0] || null;
}

/** 更新验证码尝试次数 */
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

/** 标记验证码已使用 */
async function markCodeUsed(codeId: number) {
  await query('UPDATE email_verification_codes SET used = 1 WHERE id = ?', [codeId]);
}

/** 查找用户 */
async function findUserByEmail(email: string): Promise<{ id: number } | null> {
  const users = await query<{ id: number }[]>(
    'SELECT id FROM users WHERE email = ? AND (status IS NULL OR status = 0)',
    [email]
  );
  return users[0] || null;
}

/** 更新用户密码 */
async function updateUserPassword(userId: number, passwordHash: string) {
  await query(
    'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
    [passwordHash, userId]
  );
}

// ============ 业务逻辑层 ============

/** 验证验证码 */
async function verifyCode(email: string, inputCode: string) {
  const codeRecord = await getLatestValidCode(email);
  
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

/** 重置密码 */
async function resetPasswordLogic(email: string, newPassword: string, codeId: number) {
  const user = await findUserByEmail(email);
  if (!user) {
    return { ok: false, status: 404, error: '用户不存在' };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await updateUserPassword(user.id, passwordHash);
  await markCodeUsed(codeId);

  return { ok: true };
}

// ============ 接口处理层 ============

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json();

    // 参数校验
    if (!code || code.length !== 6) {
      return Response.json({ error: '请输入6位验证码' }, { status: 400 });
    }
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return Response.json({ error: emailValidation.message }, { status: 400 });
    }
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return Response.json({ error: passwordValidation.message }, { status: 400 });
    }

    // 验证验证码
    const verifyResult = await verifyCode(email, code);
    if (!verifyResult.ok) {
      return Response.json({ error: verifyResult.error }, { status: verifyResult.status });
    }

    // 重置密码
    const resetResult = await resetPasswordLogic(email, newPassword, verifyResult.codeId!);
    if (!resetResult.ok) {
      return Response.json({ error: resetResult.error }, { status: resetResult.status });
    }

    return Response.json({ success: true, message: '密码重置成功' });
  } catch (error) {
    console.error('[ResetPassword] Error:', error);
    return Response.json({ error: '重置失败，请稍后重试' }, { status: 500 });
  }
}
