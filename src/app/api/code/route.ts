import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

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

interface ProgressRow {
  is_favorite: number;
  status: number;
}

interface UserAnswerRow {
  code: string;
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

      // 查询用户进度和保存的代码（需要用户登录）
      let isFavorited = false;
      let userStatus = 0;
      let savedCode: string | null = null;

      const session = await auth();
      if (session?.user?.id) {
        const userId = Number(session.user.id);
        
        // 查询进度（收藏状态 + 完成状态）
        const progress = await query<ProgressRow[]>(
          'SELECT is_favorite, status FROM user_code_progress WHERE user_id = ? AND question_id = ?',
          [userId, row.id]
      );
        if (progress.length > 0) {
          isFavorited = progress[0].is_favorite === 1;
          userStatus = progress[0].status;
        }

        // 查询用户保存的代码
        const userAnswer = await query<UserAnswerRow[]>(
          'SELECT code FROM user_answers WHERE user_id = ? AND question_id = ?',
          [userId, row.id]
        );
        if (userAnswer.length > 0 && userAnswer[0].code) {
          savedCode = userAnswer[0].code;
        }
      }

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
        userStatus,
        savedCode,
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
