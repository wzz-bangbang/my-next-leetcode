import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface CodeQuestionListRow {
  id: number;
  slug: string;
  title: string;
  category_ids: number[] | null;
  difficulty: number;
}

interface CodeQuestionDetailRow extends CodeQuestionListRow {
  description: string | null;
  template: string | null;
  solution: string | null;
  test_cases: Array<{ input: string; expected: string; description?: string }> | null;
  follow_up: string[] | null;
}

interface FavoriteRow {
  question_id: number;
}

// GET: 获取代码题数据
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get('id');

  try {
    // 获取单个题目详情（包含收藏状态）
    if (questionId) {
      const rows = await query<CodeQuestionDetailRow[]>(
        'SELECT id, slug, title, category_ids, difficulty, description, template, solution, test_cases, follow_up FROM code_questions WHERE id = ? OR slug = ?',
        [questionId, questionId]
      );

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }

      const row = rows[0];

      // 查询收藏状态
      const favorites = await query<FavoriteRow[]>(
        'SELECT question_id FROM user_favorites WHERE user_id = 1 AND question_id = ? AND question_type = 1',
        [row.id]
      );
      const isFavorited = favorites.length > 0;

      return NextResponse.json({
        id: row.id,
        slug: row.slug,
        title: row.title,
        tags: row.category_ids || [],
        difficulty: row.difficulty,
        description: row.description,
        template: row.template,
        solution: row.solution,
        testCases: row.test_cases,
        followUp: row.follow_up,
        isFavorited,
      });
    }

    // 获取列表（只返回基础信息）
    const questions = await query<CodeQuestionListRow[]>(
      'SELECT id, slug, title, category_ids, difficulty FROM code_questions ORDER BY sort_order'
    );

    const result = questions.map(row => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      tags: row.category_ids || [],
      difficulty: row.difficulty,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
