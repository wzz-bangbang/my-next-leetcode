import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 题目类型: 1=code, 2=bagu
interface StatusRow {
  question_id: number;
  question_type: number;
  status: number;
}

// GET: 获取题目状态
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get('questionId');
  const questionType = parseInt(searchParams.get('type') || '1');

  try {
    // 获取所有状态
    if (!questionId) {
      const rows = await query<StatusRow[]>(
        'SELECT question_id, status FROM user_question_status WHERE user_id = 1 AND question_type = ?',
        [questionType]
      );

      const statusMap: Record<string, number> = {};
      rows.forEach(row => {
        statusMap[row.question_id] = row.status;
      });

      return NextResponse.json({ statusMap });
    }

    // 获取单个题目状态
    const rows = await query<StatusRow[]>(
      'SELECT status FROM user_question_status WHERE user_id = 1 AND question_id = ? AND question_type = ?',
      [questionId, questionType]
    );

    return NextResponse.json({
      status: rows.length > 0 ? rows[0].status : 0
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// POST: 更新题目状态
export async function POST(request: NextRequest) {
  try {
    const { questionId, questionType = 1, status } = await request.json();

    if (!questionId || typeof status === 'undefined') {
      return NextResponse.json(
        { error: 'questionId and status are required' },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO user_question_status (user_id, question_id, question_type, status)
       VALUES (1, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = CURRENT_TIMESTAMP`,
      [questionId, questionType, status]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// PUT: 批量导入状态（用于迁移 localStorage 数据）
export async function PUT(request: NextRequest) {
  try {
    const { statusList, questionType = 1 } = await request.json();

    if (!Array.isArray(statusList) || statusList.length === 0) {
      return NextResponse.json({ error: 'statusList is required' }, { status: 400 });
    }

    // 批量插入
    const values = statusList.map(item => [1, item.questionId, questionType, item.status]);
    const placeholders = values.map(() => '(?, ?, ?, ?)').join(', ');
    const flatValues = values.flat();

    await query(
      `INSERT INTO user_question_status (user_id, question_id, question_type, status)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = CURRENT_TIMESTAMP`,
      flatValues
    );

    return NextResponse.json({ success: true, count: statusList.length });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
