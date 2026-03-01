/**
 * 用户行为分析 API
 * 记录用户的页面访问和操作行为
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// POST /api/analytics - 记录用户行为
export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : null;

    const body = await request.json();
    const { event, data, timestamp, url } = body;

    if (!event) {
      return NextResponse.json({ error: '缺少事件名称' }, { status: 400 });
    }

    // 存储到数据库
    await query(
      `INSERT INTO user_analytics (user_id, event, data, url, created_at) VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        event,
        data ? JSON.stringify(data) : null,
        url || null,
        timestamp ? new Date(timestamp) : new Date(),
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    // 埋点失败不返回错误，避免影响用户体验
    return NextResponse.json({ success: false });
  }
}

// GET /api/analytics - 获取用户行为统计（管理员用）
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // 获取最近 N 天的统计
    const stats = await query<{
      event: string;
      count: number;
      unique_users: number;
    }[]>(
      `SELECT 
        event,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
       FROM user_analytics 
       WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY event
       ORDER BY count DESC`,
      [days]
    );

    // 获取热门题目
    const hotQuestions = await query<{
      question_id: number;
      question_title: string;
      type: string;
      views: number;
    }[]>(
      `SELECT 
        JSON_EXTRACT(data, '$.questionId') as question_id,
        JSON_EXTRACT(data, '$.questionTitle') as question_title,
        JSON_EXTRACT(data, '$.type') as type,
        COUNT(*) as views
       FROM user_analytics 
       WHERE event = 'question_view' 
         AND created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
         AND JSON_EXTRACT(data, '$.questionId') IS NOT NULL
       GROUP BY question_id, question_title, type
       ORDER BY views DESC
       LIMIT 10`,
      [days]
    );

    return NextResponse.json({ stats, hotQuestions });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    return NextResponse.json({ error: '获取统计失败' }, { status: 500 });
  }
}
