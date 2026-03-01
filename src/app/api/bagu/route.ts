import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

interface BaguCategoryRow {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
}

interface BaguQuestionRow {
  id: number;
  slug: string;
  category_id: number;
  title: string;
  content: string | null;
  has_answer: number;
  sort_order: number;
}

interface ProgressRow {
  is_favorite: number;
  status: number;
}

// GET: 获取八股文数据
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get('id');

  try {
    // 获取单个题目详情（包含收藏状态）
    if (questionId) {
      const rows = await query<BaguQuestionRow[]>(
        'SELECT id, slug, category_id, title, content, has_answer, sort_order FROM bagu_questions WHERE id = ? OR slug = ?',
        [questionId, questionId]
      );

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }

      const row = rows[0];

      // 查询用户进度（收藏状态 + 完成状态）
      let isFavorited = false;
      let userStatus = 0;

      const session = await auth();
      if (session?.user?.id) {
        const userId = Number(session.user.id);
        const progress = await query<ProgressRow[]>(
          'SELECT is_favorite, status FROM user_bagu_progress WHERE user_id = ? AND question_id = ?',
          [userId, row.id]
      );
        if (progress.length > 0) {
          isFavorited = progress[0].is_favorite === 1;
          userStatus = progress[0].status;
        }
      }

      return NextResponse.json({
        id: row.id,
        slug: row.slug,
        categoryId: row.category_id,
        title: row.title,
        content: row.content,
        hasAnswer: row.has_answer === 1,
        isFavorited,
        userStatus,
      });
    }

    // 获取列表（只返回基础信息，不含 content）
    const categories = await query<BaguCategoryRow[]>(
      'SELECT id, slug, name, sort_order FROM bagu_categories ORDER BY sort_order'
    );

    const questions = await query<(Pick<BaguQuestionRow, 'id' | 'slug' | 'category_id' | 'title' | 'has_answer'>)[]>(
      'SELECT id, slug, category_id, title, has_answer FROM bagu_questions ORDER BY sort_order'
    );

    // 按分类组织数据（icon 从前端枚举获取）
    const result = {
      categories: categories.map(cat => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        questions: questions
          .filter(q => q.category_id === cat.id)
          .map(q => ({
            id: q.id,
            slug: q.slug,
            title: q.title,
            hasAnswer: q.has_answer === 1,
          })),
      })),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
