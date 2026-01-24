'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { notifications } from '@mantine/notifications';
import Header from '@/components/Header';
import { getFavorites, loadFavoritesFromServer, setFavorite } from '@/lib/favorites';
import { getBaguData, getCachedBaguData } from '@/lib/bagu-data';
import { CategoryTag, CategoryTagLabel } from '@/types/question';
import type { BaguData, BaguQuestion } from '@/types/bagu';

interface CodeQuestion {
  id: number;
  slug: string;
  title: string;
  difficulty: number;
  tags: number[];
  description?: string;
}

export default function FavoritesPage() {
  const [baguFavorites, setBaguFavorites] = useState<Set<number>>(new Set());
  const [codeFavorites, setCodeFavorites] = useState<Set<number>>(new Set());
  const [baguData, setBaguData] = useState<BaguData | null>(null);
  const [codeQuestions, setCodeQuestions] = useState<CodeQuestion[]>([]);
  const [activeTab, setActiveTab] = useState<'bagu' | 'code'>('bagu');

  // 加载数据
  useEffect(() => {
    // 加载收藏
    setBaguFavorites(getFavorites('bagu'));
    setCodeFavorites(getFavorites('code'));
    loadFavoritesFromServer('bagu').then(setBaguFavorites);
    loadFavoritesFromServer('code').then(setCodeFavorites);

    // 加载八股数据
    const cached = getCachedBaguData();
    if (cached) {
      setBaguData(cached);
    } else {
      getBaguData().then(setBaguData);
    }

    // 加载刷题数据
    fetch('/api/code')
      .then((res) => res.json())
      .then(setCodeQuestions);
  }, []);

  // 八股文收藏按分类分组
  const baguFavoritesByCategory = useMemo(() => {
    if (!baguData) return new Map<number, { name: string; questions: BaguQuestion[] }>();

    const map = new Map<number, { name: string; questions: BaguQuestion[] }>();

    for (const category of baguData.categories) {
      const favQuestions = category.questions.filter((q) => baguFavorites.has(q.id));
      if (favQuestions.length > 0) {
        map.set(category.id, { name: category.name, questions: favQuestions });
      }
    }

    return map;
  }, [baguData, baguFavorites]);

  // 刷题收藏按分类分组
  const codeFavoritesByCategory = useMemo(() => {
    const map = new Map<CategoryTag, CodeQuestion[]>();
    
    // 初始化分类
    Object.values(CategoryTag)
      .filter((v) => typeof v === 'number')
      .forEach((tag) => {
        map.set(tag as CategoryTag, []);
      });
    
    // 筛选收藏的题目并分组
    codeQuestions
      .filter((q) => codeFavorites.has(q.id))
      .forEach((q) => {
        q.tags.forEach((tag) => {
          const list = map.get(tag as CategoryTag);
          if (list) {
            // 避免重复添加
            if (!list.find((item) => item.id === q.id)) {
              list.push(q);
            }
          }
        });
      });
    
    // 过滤空分类
    const filtered = new Map<CategoryTag, CodeQuestion[]>();
    map.forEach((questions, tag) => {
      if (questions.length > 0) {
        filtered.set(tag, questions);
      }
    });
    
    return filtered;
  }, [codeQuestions, codeFavorites]);

  const baguCount = baguFavorites.size;
  const codeCount = codeFavorites.size;

  // 复制八股文收藏列表
  const copyBaguList = useCallback(async () => {
    const lines: string[] = [];
    
    baguFavoritesByCategory.forEach(({ questions }) => {
      questions.forEach((q) => {
        lines.push(q.title);
      });
    });

    const text = lines.join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
      notifications.show({
        autoClose: 1500,
        title: '📋 已复制',
        message: `已复制 ${baguCount} 道题目到剪贴板`,
        color: 'green',
      });
    } catch {
      notifications.show({
        autoClose: 1500,
        title: '复制失败',
        message: '请手动复制',
        color: 'red',
      });
    }
  }, [baguFavoritesByCategory, baguCount]);

  // 取消收藏八股文
  const removeBaguFavorite = useCallback((questionId: number) => {
    setFavorite('bagu', questionId, false);
    setBaguFavorites((prev) => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
    notifications.show({
      autoClose: 1500,
      title: '已取消收藏',
      message: '题目已从收藏中移除',
      color: 'gray',
    });
  }, []);

  // 取消收藏刷题
  const removeCodeFavorite = useCallback((questionId: number) => {
    setFavorite('code', questionId, false);
    setCodeFavorites((prev) => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
    notifications.show({
      autoClose: 1500,
      title: '已取消收藏',
      message: '题目已从收藏中移除',
      color: 'gray',
    });
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(255, 182, 193, 0.4) 0%,
            rgba(152, 251, 152, 0.3) 25%,
            rgba(135, 206, 250, 0.4) 50%,
            rgba(221, 160, 221, 0.3) 75%,
            rgba(255, 255, 224, 0.4) 100%
          )
        `,
      }}
    >
      <Header />

      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-8 max-w-4xl mx-auto w-full">
        {/* 标题 */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-base sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">⭐ 收藏清单</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            共收藏 {baguCount + codeCount} 道题目
          </p>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab('bagu')}
            className={`px-2.5 sm:px-4 py-1 sm:py-2 rounded-full !text-[10px] sm:!text-sm font-medium transition-all ${
              activeTab === 'bagu'
                ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md'
                : 'bg-white/60 text-gray-600 hover:bg-white/80'
            }`}
          >
            📚 八股文 ({baguCount})
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-2.5 sm:px-4 py-1 sm:py-2 rounded-full !text-[10px] sm:!text-sm font-medium transition-all ${
              activeTab === 'code'
                ? 'bg-gradient-to-r from-violet-400 to-purple-400 text-white shadow-md'
                : 'bg-white/60 text-gray-600 hover:bg-white/80'
            }`}
          >
            🚀 刷题 ({codeCount})
          </button>
        </div>

        {/* 内容区 */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 sm:p-6 shadow-sm">
          {activeTab === 'bagu' ? (
            baguFavoritesByCategory.size === 0 ? (
              <EmptyState type="bagu" />
            ) : (
              <div className="space-y-3 sm:space-y-6">
                {/* 操作栏 */}
                <div className="flex items-center justify-start">
                  <button
                    onClick={copyBaguList}
                    className="flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-full !text-[10px] sm:!text-xs font-medium text-gray-600 bg-white/70 hover:bg-white hover:text-pink-600 hover:shadow-sm transition-all border border-gray-200/50"
                  >
                    <span>📋</span>
                    <span>复制题目列表</span>
                  </button>
                </div>
                
                {Array.from(baguFavoritesByCategory.entries()).map(([categoryId, { name, questions }]) => (
                  <div key={categoryId}>
                    <h3 className="text-[11px] sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-pink-400" />
                      {name}
                      <span className="text-[10px] sm:text-xs text-gray-400 font-normal">({questions.length})</span>
                    </h3>
                    <div className="space-y-1 sm:space-y-2">
                      {questions.map((q) => (
                        <div
                          key={q.id}
                          className="flex items-center gap-2 px-2.5 sm:px-4 py-1.5 sm:py-3 rounded-lg sm:rounded-xl bg-white/70 hover:bg-white hover:shadow-sm transition-all group"
                        >
                          <Link
                            href={`/bagu?q=${q.id}`}
                            className="flex-1 text-[11px] sm:text-sm text-gray-700 hover:text-pink-600 truncate"
                          >
                            {q.title}
                          </Link>
                          <button
                            onClick={() => removeBaguFavorite(q.id)}
                            className="flex-shrink-0 sm:px-2 sm:py-0.5 sm:rounded-full sm:border sm:border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all"
                          >
                            <span className="sm:hidden text-sm">★</span>
                            <span className="hidden sm:inline text-xs">取消收藏</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : codeFavoritesByCategory.size === 0 ? (
            <EmptyState type="code" />
          ) : (
            <div className="space-y-3 sm:space-y-6">
              {Array.from(codeFavoritesByCategory.entries()).map(([tag, questions]) => (
                <div key={tag}>
                  <h3 className="text-[11px] sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-violet-400" />
                    {CategoryTagLabel[tag]}
                    <span className="text-[10px] sm:text-xs text-gray-400 font-normal">({questions.length})</span>
                  </h3>
                  <div className="space-y-1 sm:space-y-2">
                    {questions.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center gap-2 px-2.5 sm:px-4 py-1.5 sm:py-3 rounded-lg sm:rounded-xl bg-white/70 hover:bg-white hover:shadow-sm transition-all group"
                      >
                        <Link
                          href={`/code-editor?q=${tag}-${q.slug}`}
                          className="flex-1 text-[11px] sm:text-sm text-gray-700 hover:text-violet-600 truncate"
                        >
                          {q.title}
                        </Link>
                        <button
                          onClick={() => removeCodeFavorite(q.id)}
                          className="flex-shrink-0 sm:px-2 sm:py-0.5 sm:rounded-full sm:border sm:border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all"
                        >
                          <span className="sm:hidden text-sm">★</span>
                          <span className="hidden sm:inline text-xs">取消收藏</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyState({ type }: { type: 'bagu' | 'code' }) {
  return (
    <div className="py-8 sm:py-12 text-center">
      <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{type === 'bagu' ? '📚' : '🚀'}</div>
      <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">暂无收藏的{type === 'bagu' ? '八股文' : '刷题'}题目</p>
      <Link
        href={type === 'bagu' ? '/bagu' : '/code-editor'}
        className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium text-white shadow-md"
        style={{
          background:
            type === 'bagu'
              ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        去{type === 'bagu' ? '看八股文' : '刷题'}
      </Link>
    </div>
  );
}

