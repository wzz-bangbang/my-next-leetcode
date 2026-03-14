/**
 * 检查用户是否已设置密码
 * GET /api/auth/check-password
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const users = await query<{ password_hash: string | null }[]>(
      'SELECT password_hash FROM users WHERE id = ? AND (status IS NULL OR status = 0)',
      [session.user.id]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({ hasPassword: !!users[0].password_hash });
  } catch (error) {
    console.error('[Auth] Check password error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
