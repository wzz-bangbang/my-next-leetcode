import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

interface UserAnswer {
  id: number;
  question_id: number;
  code: string;
}

// GET: 获取用户答案
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get('questionId');

  try {
    // 如果没有 questionId，返回所有有答案的题目 ID 列表
    if (!questionId) {
      const rows = await query<UserAnswer[]>(
        'SELECT question_id FROM user_answers WHERE user_id = ? AND code IS NOT NULL AND code != ""',
        [userId]
      );

      const answeredIds = rows.map(row => row.question_id);
      return NextResponse.json({ answeredIds });
    }

    // 获取特定题目的答案
    const rows = await query<UserAnswer[]>(
      'SELECT code FROM user_answers WHERE user_id = ? AND question_id = ?',
      [userId, questionId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ code: '' });
    }

    return NextResponse.json({ code: rows[0].code });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}

// POST: 保存用户答案
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  try {
    const { questionId, code } = await request.json();

    if (!questionId || typeof code === 'undefined') {
      return NextResponse.json(
        { error: 'questionId and code are required' },
        { status: 400 }
      );
    }

    // 使用 UPSERT（INSERT ... ON DUPLICATE KEY UPDATE）
    await query(
      `INSERT INTO user_answers (user_id, question_id, code)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), updated_at = CURRENT_TIMESTAMP`,
      [userId, questionId, code]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}
