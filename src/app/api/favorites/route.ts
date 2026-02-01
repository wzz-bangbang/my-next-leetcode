import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

// 题目类型到表名的映射
const TABLE_MAP: Record<string, string> = {
  code: 'user_code_progress',
  bagu: 'user_bagu_progress',
};

interface FavoriteRow {
  question_id: number;
}

// GET: 获取收藏列表
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as 'bagu' | 'code' | null;

  try {
    if (type && TABLE_MAP[type]) {
      const rows = await query<FavoriteRow[]>(
        `SELECT question_id FROM ${TABLE_MAP[type]} WHERE user_id = ? AND is_favorite = 1`,
        [userId]
      );
      const ids = rows.map(row => row.question_id);
      return NextResponse.json({ ids });
    }

    // 返回全部
    const baguRows = await query<FavoriteRow[]>(
      'SELECT question_id FROM user_bagu_progress WHERE user_id = ? AND is_favorite = 1',
      [userId]
    );
    const codeRows = await query<FavoriteRow[]>(
      'SELECT question_id FROM user_code_progress WHERE user_id = ? AND is_favorite = 1',
      [userId]
    );

    return NextResponse.json({
      bagu: baguRows.map(row => row.question_id),
      code: codeRows.map(row => row.question_id),
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}

// POST: 保存收藏列表（全量覆盖某类型的收藏）
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  try {
    const body = await request.json();
    const { type, ids } = body as { type: string; ids: number[] };

    if (!type || !Array.isArray(ids) || !TABLE_MAP[type]) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const tableName = TABLE_MAP[type];

    // 先将该类型所有记录的 is_favorite 设为 0
    await query(`UPDATE ${tableName} SET is_favorite = 0 WHERE user_id = ?`, [userId]);

    // 批量设置新收藏
    if (ids.length > 0) {
      const values = ids.map(id => [userId, id, 1]);
      const placeholders = values.map(() => '(?, ?, ?)').join(', ');
      const flatValues = values.flat();

      await query(
        `INSERT INTO ${tableName} (user_id, question_id, is_favorite)
         VALUES ${placeholders}
         ON DUPLICATE KEY UPDATE is_favorite = 1`,
        flatValues
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}

// PATCH: 切换单个题目的收藏状态
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  try {
    const { type, questionId, isFavorite } = await request.json();

    if (!type || !questionId || typeof isFavorite !== 'boolean' || !TABLE_MAP[type]) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const tableName = TABLE_MAP[type];

    await query(
      `INSERT INTO ${tableName} (user_id, question_id, is_favorite)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_favorite = VALUES(is_favorite), updated_at = CURRENT_TIMESTAMP`,
      [userId, questionId, isFavorite ? 1 : 0]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Toggle failed' }, { status: 500 });
  }
}
