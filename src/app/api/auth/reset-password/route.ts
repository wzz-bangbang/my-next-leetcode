import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { validateEmail, validatePasswordStrength } from '@/lib/validation';
import { CODE_TYPE } from '@/lib/email';
import { verifyCodeWithCheck, markCodeUsed } from '@/lib/verifyCode';

// ============ 数据访问层 ============

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
      return NextResponse.json({ error: '请输入6位验证码' }, { status: 400 });
    }
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.message }, { status: 400 });
    }
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 });
    }

    // 验证验证码
    const verifyResult = await verifyCodeWithCheck(email, code, CODE_TYPE.RESET);
    if (!verifyResult.ok) {
      return NextResponse.json({ error: verifyResult.error }, { status: verifyResult.status });
    }

    // 重置密码
    const resetResult = await resetPasswordLogic(email, newPassword, verifyResult.codeId!);
    if (!resetResult.ok) {
      return NextResponse.json({ error: resetResult.error }, { status: resetResult.status });
    }

    return NextResponse.json({ success: true, message: '密码重置成功' });
  } catch (error) {
    console.error('[ResetPassword] Error:', error);
    return NextResponse.json({ error: '重置失败，请稍后重试' }, { status: 500 });
  }
}
