/**
 * 设置密码 API（第三方登录用户首次设置密码）
 * POST /api/auth/set-password
 */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { validatePassword } from '@/lib/validation';

// ============ 数据访问层 ============

/** 检查用户是否已有密码 */
async function checkUserHasPassword(userId: string): Promise<{ exists: boolean; hasPassword: boolean }> {
  const users = await query<{ id: number; password_hash: string | null }[]>(
    'SELECT id, password_hash FROM users WHERE id = ? AND (status IS NULL OR status = 0)',
    [userId]
  );
  if (users.length === 0) {
    return { exists: false, hasPassword: false };
  }
  return { exists: true, hasPassword: !!users[0].password_hash };
}

/** 设置用户密码 */
async function setUserPassword(userId: string, hashedPassword: string) {
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);
}

// ============ 接口处理层 ============

export async function POST(request: Request) {
  try {
    // 验证登录状态
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    const userId = session.user.id;

    const { newPassword } = await request.json();

    // 参数校验
    const pwdValidation = validatePassword(newPassword);
    if (!pwdValidation.valid) {
      return NextResponse.json({ error: pwdValidation.message }, { status: 400 });
    }

    // 检查用户是否已有密码
    const { exists, hasPassword } = await checkUserHasPassword(userId);
    if (!exists) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }
    if (hasPassword) {
      return NextResponse.json({ error: '您已设置密码，请使用修改密码功能' }, { status: 400 });
    }

    // 设置密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await setUserPassword(userId, hashedPassword);
    console.log('[Auth] Password set for user:', userId);

    return NextResponse.json({ message: '密码设置成功' });
  } catch (error) {
    console.error('[Auth] Set password error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
