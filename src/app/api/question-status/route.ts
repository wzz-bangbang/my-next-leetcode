import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

// 题目类型到表名的映射
const TABLE_MAP: Record<string, string> = {
  '1': 'user_code_progress',
  '2': 'user_bagu_progress',
  'code': 'user_code_progress',
  'bagu': 'user_bagu_progress',
};

interface StatusRow {
  question_id: number;
  status: number;
}

// GET: 获取题目状态
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get('questionId');
  const type = searchParams.get('type') || '1';
  const tableName = TABLE_MAP[type] || 'user_code_progress';

  try {
    // 获取所有状态
    if (!questionId) {
      const rows = await query<StatusRow[]>(
        `SELECT question_id, status FROM ${tableName} WHERE user_id = ? AND status > 0`,
        [userId]
      );

      const statusMap: Record<string, number> = {};
      rows.forEach(row => {
        statusMap[row.question_id] = row.status;
      });

      return NextResponse.json({ statusMap });
    }

    // 获取单个题目状态
    const rows = await query<StatusRow[]>(
      `SELECT status FROM ${tableName} WHERE user_id = ? AND question_id = ?`,
      [userId, questionId]
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  try {
    const { questionId, questionType = 1, status } = await request.json();
    const tableName = TABLE_MAP[String(questionType)] || 'user_code_progress';

    if (!questionId || typeof status === 'undefined') {
      return NextResponse.json(
        { error: 'questionId and status are required' },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO ${tableName} (user_id, question_id, status)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = CURRENT_TIMESTAMP`,
      [userId, questionId, status]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// PUT: 批量导入状态（用于迁移 localStorage 数据）
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  try {
    const { statusList, questionType = 1 } = await request.json();
    const tableName = TABLE_MAP[String(questionType)] || 'user_code_progress';

    if (!Array.isArray(statusList) || statusList.length === 0) {
      return NextResponse.json({ error: 'statusList is required' }, { status: 400 });
    }

    // 批量插入
    const values = statusList.map(item => [userId, item.questionId, item.status]);
    const placeholders = values.map(() => '(?, ?, ?)').join(', ');
    const flatValues = values.flat();

    await query(
      `INSERT INTO ${tableName} (user_id, question_id, status)
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
