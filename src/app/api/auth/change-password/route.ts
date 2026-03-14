/**
 * 修改密码 API
 * POST /api/auth/change-password
 */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { validatePassword } from '@/lib/validation';

// ============ 数据访问层 ============

/** 查找用户（包含密码） */
async function findUserWithPassword(userId: string): Promise<{ id: number; password_hash: string | null } | null> {
  const users = await query<{ id: number; password_hash: string | null }[]>(
    'SELECT id, password_hash FROM users WHERE id = ? AND (status IS NULL OR status = 0)',
    [userId]
  );
  return users[0] || null;
}

/** 更新用户密码 */
async function updateUserPassword(userId: string, hashedPassword: string) {
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);
}

// ============ 业务逻辑层 ============

/** 验证原密码 */
async function verifyOldPassword(userId: string, oldPassword: string) {
  const user = await findUserWithPassword(userId);
  
  if (!user) {
    return { ok: false, status: 404, error: '用户不存在' };
  }

  // 第三方登录用户没有密码
  if (!user.password_hash) {
    return { ok: false, status: 400, error: '您使用第三方登录，请先设置密码' };
  }

  // 验证原密码
  const isValid = await bcrypt.compare(oldPassword, user.password_hash);
  if (!isValid) {
    return { ok: false, status: 400, error: '原密码错误' };
  }

  return { ok: true };
}

/** 修改密码 */
async function changePasswordLogic(userId: string, newPassword: string) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await updateUserPassword(userId, hashedPassword);
  console.log('[Auth] Password changed for user:', userId);
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

    const { oldPassword, newPassword } = await request.json();

    // 参数校验
    if (!oldPassword) {
      return NextResponse.json({ error: '请输入原密码' }, { status: 400 });
    }
    const pwdValidation = validatePassword(newPassword);
    if (!pwdValidation.valid) {
      return NextResponse.json({ error: pwdValidation.message }, { status: 400 });
    }

    // 验证原密码
    const verifyResult = await verifyOldPassword(userId, oldPassword);
    if (!verifyResult.ok) {
      return NextResponse.json({ error: verifyResult.error }, { status: verifyResult.status });
    }

    // 修改密码
    await changePasswordLogic(userId, newPassword);

    return NextResponse.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('[Auth] Change password error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
