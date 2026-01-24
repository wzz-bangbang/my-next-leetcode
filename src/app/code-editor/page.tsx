import { Suspense } from 'react';
import { query } from '@/lib/db';
import type { QuestionListItem, CategoryTag } from '@/types/question';
import CodeEditorClient from './_components/CodeEditorClient';

interface CodeQuestionListRow {
  id: number;
  slug: string;
  title: string;
  category_ids: CategoryTag[] | null;
  difficulty: number;
}

// 服务端获取列表数据（不含详情）
async function getCodeQuestionList(): Promise<QuestionListItem[]> {
  const rows = await query<CodeQuestionListRow[]>(
    'SELECT id, slug, title, category_ids, difficulty FROM code_questions ORDER BY sort_order'
  );

  return rows.map(row => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    difficulty: row.difficulty,
    tags: row.category_ids || [],
  }));
}

export default async function CodeEditorPage() {
  const questions = await getCodeQuestionList();

  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">加载中...</div>}>
      <CodeEditorClient initialQuestions={questions} />
    </Suspense>
  );
}
