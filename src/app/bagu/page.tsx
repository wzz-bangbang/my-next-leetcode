import { Suspense } from 'react';
import { query } from '@/lib/db';
import type { BaguListData } from '@/types/bagu';
import BaguClient from './_components/BaguClient';

interface BaguCategoryRow {
  id: number;
  slug: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

interface BaguQuestionRow {
  id: number;
  slug: string;
  category_id: number;
  title: string;
  has_answer: number;
}

// 服务端获取列表数据（不含 content）
async function getBaguListData(): Promise<BaguListData> {
  const categories = await query<BaguCategoryRow[]>(
    'SELECT id, slug, name, icon, sort_order FROM bagu_categories ORDER BY sort_order'
  );

  const questions = await query<BaguQuestionRow[]>(
    'SELECT id, slug, category_id, title, has_answer FROM bagu_questions ORDER BY sort_order'
  );

  return {
    categories: categories.map(cat => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      icon: cat.icon,
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
}

export default async function BaguPage() {
  const data = await getBaguListData();

  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">加载中...</div>}>
      <BaguClient initialData={data} />
    </Suspense>
  );
}
