import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

// 题目类型到进度表名的映射
const TABLE_MAP: Record<string, string> = {
  '1': 'user_code_progress',
  '2': 'user_bagu_progress',
  'code': 'user_code_progress',
  'bagu': 'user_bagu_progress',
};

// 题目类型到题目表名的映射
const QUESTION_TABLE_MAP: Record<string, string> = {
  '1': 'code_questions',
  '2': 'bagu_questions',
  'code': 'code_questions',
  'bagu': 'bagu_questions',
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
    const typeKey = String(questionType);
    const tableName = TABLE_MAP[typeKey] || 'user_code_progress';
    const questionTable = QUESTION_TABLE_MAP[typeKey] || 'code_questions';

    // 校验 questionId 必须是正整数
    if (!Number.isInteger(questionId) || questionId <= 0) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    if (typeof status === 'undefined') {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    // 校验题目是否存在
    const questionExists = await query<{ id: number }[]>(
      `SELECT id FROM ${questionTable} WHERE id = ? LIMIT 1`,
      [questionId]
    );
    if (questionExists.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
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
    const typeKey = String(questionType);
    const tableName = TABLE_MAP[typeKey] || 'user_code_progress';
    const questionTable = QUESTION_TABLE_MAP[typeKey] || 'code_questions';

    if (!Array.isArray(statusList) || statusList.length === 0) {
      return NextResponse.json({ error: 'statusList is required' }, { status: 400 });
    }

    // 过滤出有效的 questionId（正整数）
    const validItems = statusList.filter(
      item => Number.isInteger(item.questionId) && item.questionId > 0
    );

    if (validItems.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // 校验题目是否存在
    const questionIds = validItems.map(item => item.questionId);
    const placeholders = questionIds.map(() => '?').join(',');
    const existingQuestions = await query<{ id: number }[]>(
      `SELECT id FROM ${questionTable} WHERE id IN (${placeholders})`,
      questionIds
    );
    const existingIds = new Set(existingQuestions.map(q => q.id));

    // 只保留存在的题目
    const finalItems = validItems.filter(item => existingIds.has(item.questionId));

    if (finalItems.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // 批量插入
    const values = finalItems.map(item => [userId, item.questionId, item.status]);
    const insertPlaceholders = values.map(() => '(?, ?, ?)').join(', ');
    const flatValues = values.flat();

    await query(
      `INSERT INTO ${tableName} (user_id, question_id, status)
       VALUES ${insertPlaceholders}
       ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = CURRENT_TIMESTAMP`,
      flatValues
    );

    return NextResponse.json({ success: true, count: finalItems.length });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
