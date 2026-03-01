import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const userId = Number(session.user.id);

    // 将用户状态标记为已注销（status = 0 表示正常，status = 1 表示已注销）
    // 保留 accounts 记录用于历史追溯，用户再次登录时会自动重新激活
    const result = await query(
      'UPDATE users SET status = 1, updated_at = NOW() WHERE id = ?',
      [userId]
    );

    // 检查是否更新成功
    if ((result as { affectedRows: number }).affectedRows === 0) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: '账号已注销' });
  } catch (error) {
    console.error('[Deactivate] Error:', error);
    return NextResponse.json({ error: '注销失败，请稍后重试' }, { status: 500 });
  }
}
