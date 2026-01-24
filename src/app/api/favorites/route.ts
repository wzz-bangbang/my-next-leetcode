import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 题目类型: 1=code, 2=bagu
const TYPE_MAP: Record<string, number> = {
  code: 1,
  bagu: 2,
};

interface FavoriteRow {
  question_id: number;
}

// GET: 获取收藏列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as 'bagu' | 'code' | null;

  try {
    if (type && TYPE_MAP[type]) {
      const rows = await query<FavoriteRow[]>(
        'SELECT question_id FROM user_favorites WHERE user_id = 1 AND question_type = ?',
        [TYPE_MAP[type]]
      );
      const ids = rows.map(row => row.question_id);
      return NextResponse.json({ ids });
    }

    // 返回全部
    const baguRows = await query<FavoriteRow[]>(
      'SELECT question_id FROM user_favorites WHERE user_id = 1 AND question_type = ?',
      [TYPE_MAP.bagu]
    );
    const codeRows = await query<FavoriteRow[]>(
      'SELECT question_id FROM user_favorites WHERE user_id = 1 AND question_type = ?',
      [TYPE_MAP.code]
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

// POST: 保存收藏列表
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ids } = body as { type: string; ids: number[] };

    if (!type || !Array.isArray(ids) || !TYPE_MAP[type]) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const typeValue = TYPE_MAP[type];

    // 先删除该类型的所有旧收藏
    await query('DELETE FROM user_favorites WHERE user_id = 1 AND question_type = ?', [typeValue]);

    // 批量插入新收藏
    if (ids.length > 0) {
      const values = ids.map(id => [1, id, typeValue]);
      const placeholders = values.map(() => '(?, ?, ?)').join(', ');
      const flatValues = values.flat();

      await query(
        `INSERT INTO user_favorites (user_id, question_id, question_type) VALUES ${placeholders}`,
        flatValues
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
