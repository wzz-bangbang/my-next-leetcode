import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return Response.json({ error: '未登录' }, { status: 401 });
    }

    // 将用户状态标记为已注销（status = 0 表示正常，status = 1 表示已注销）
    const result = await query(
      'UPDATE users SET status = 1, updated_at = NOW() WHERE email = ?',
      [session.user.email]
    );

    // 检查是否更新成功
    if ((result as { affectedRows: number }).affectedRows === 0) {
      return Response.json({ error: '用户不存在' }, { status: 404 });
    }

    return Response.json({ success: true, message: '账号已注销' });
  } catch (error) {
    console.error('[Deactivate] Error:', error);
    return Response.json({ error: '注销失败，请稍后重试' }, { status: 500 });
  }
}
