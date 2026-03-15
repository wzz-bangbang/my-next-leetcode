'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { notifications } from '@mantine/notifications';
import Header from '@/components/Header';
import { loadFavoritesFromServer, toggleFavorite } from '@/lib/favorites';
import { getBaguData, getCachedBaguData } from '@/lib/bagu-data';
import { CategoryTag, CategoryTagLabel } from '@/types/question';
import type { BaguData, BaguQuestion } from '@/types/bagu';
import { getCodeQuestionList } from '@/services/questions';
import { StarFilledIcon, BookOpenIcon, RocketIcon, CopyIcon } from '@/components/icons';
import { iconSize } from '@/styles/theme';

interface CodeQuestion {
  id: number;
  slug: string;
  title: string;
  difficulty: number;
  tags: number[];
  description?: string;
}

export default function FavoritesPage() {
  // 监听登录状态
  const { status: sessionStatus } = useSession();
  const prevSessionStatus = useRef(sessionStatus);

  const [baguFavorites, setBaguFavorites] = useState<Set<number>>(new Set());
  const [codeFavorites, setCodeFavorites] = useState<Set<number>>(new Set());
  const [baguData, setBaguData] = useState<BaguData | null>(null);
  const [codeQuestions, setCodeQuestions] = useState<CodeQuestion[]>([]);
  const [activeTab, setActiveTab] = useState<'bagu' | 'code'>('bagu');

  // 加载数据
  useEffect(() => {
    // 加载收藏
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
    getCodeQuestionList().then(({ data }) => {
      if (data) setCodeQuestions(data);
    });
  }, []);

  // 监听登录状态变化
  useEffect(() => {
    const prev = prevSessionStatus.current;

    // 登录：重新加载收藏数据
    if (prev === 'unauthenticated' && sessionStatus === 'authenticated') {
      loadFavoritesFromServer('bagu').then(setBaguFavorites);
      loadFavoritesFromServer('code').then(setCodeFavorites);
    }

    // 退登：清空收藏数据
    if (prev === 'authenticated' && sessionStatus === 'unauthenticated') {
      setBaguFavorites(new Set());
      setCodeFavorites(new Set());
    }

    prevSessionStatus.current = sessionStatus;
  }, [sessionStatus]);

  // 八股题收藏按分类分组
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

  // 复制八股题收藏列表
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
        title: '已复制',
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

  // 取消收藏八股题
  const removeBaguFavorite = useCallback(async (questionId: number) => {
    const { success, status } = await toggleFavorite('bagu', questionId, true); // currentStatus=true means it's favorited
    if (!success) {
      if (status !== 401) {
        notifications.show({ autoClose: 2000, title: '操作失败', message: '请稍后重试', color: 'red' });
      }
      return;
    }
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
  const removeCodeFavorite = useCallback(async (questionId: number) => {
    const { success, status } = await toggleFavorite('code', questionId, true); // currentStatus=true means it's favorited
    if (!success) {
      if (status !== 401) {
        notifications.show({ autoClose: 2000, title: '操作失败', message: '请稍后重试', color: 'red' });
      }
      return;
    }
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
    <div className="bg-white  min-h-screen flex flex-col relative overflow-hidden bg-white"
    >

      <Header />

      <main className="relative z-10 flex-1 px-3 sm:px-6 py-4 sm:py-8 max-w-4xl mx-auto w-full">
        {/* 标题 */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-base sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-2">
            <StarFilledIcon size={iconSize.xl} className="text-yellow-500" />
            收藏清单
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            共收藏 {baguCount + codeCount} 道题目
          </p>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab('bagu')}
            data-active={activeTab === 'bagu'}
            className={`btn-gradient-border btn-gradient-bagu px-2.5 sm:px-4 py-1 sm:py-2 rounded-full !text-[10px] sm:!text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'bagu' ? 'active' : ''
            }`}
          >
            <BookOpenIcon size={iconSize.sm} />
            八股题 ({baguCount})
          </button>
          <button
            onClick={() => setActiveTab('code')}
            data-active={activeTab === 'code'}
            className={`btn-gradient-border btn-gradient-code px-2.5 sm:px-4 py-1 sm:py-2 rounded-full !text-[10px] sm:!text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'code' ? 'active' : ''
            }`}
          >
            <RocketIcon size={iconSize.sm} />
            刷题 ({codeCount})
          </button>
        </div>

        {/* 内容区 */}
        <div className="rounded-2xl p-3 sm:p-6 shadow-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.02) 0%, rgba(99, 102, 241, 0.02) 100%)',
        }}>
          {activeTab === 'bagu' ? (
            baguFavoritesByCategory.size === 0 ? (
              <EmptyState type="bagu" />
            ) : (
              <div className="space-y-3 sm:space-y-6">
                {/* 操作栏 */}
                <div className="flex items-center justify-start">
                  <button
                    onClick={copyBaguList}
                    className="btn-gradient-border btn-gradient-bagu flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-full !text-[10px] sm:!text-xs font-medium transition-all"
                  >
                    <CopyIcon size={iconSize.xs} />
                    <span>复制题目</span>
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
                        <Link
                          key={q.id}
                          href={`/bagu?q=${q.id}`}
                          className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl hover:bg-white hover:shadow-sm transition-all group"
                        >
                          <span className="flex-1 text-[11px] sm:text-sm text-gray-700 group-hover:text-pink-600 truncate transition-colors">
                            {q.title}
                          </span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              removeBaguFavorite(q.id);
                            }}
                            className="shrink-0 sm:px-2 sm:py-0.5 sm:rounded-lg sm:border sm:border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all"
                          >
                            <StarFilledIcon size={iconSize.sm} className="sm:hidden" />
                            <span className="hidden sm:inline text-xs">取消收藏</span>
                          </button>
                        </Link>
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
                      <Link
                        key={q.id}
                        href={`/code-editor?q=${tag}-${q.slug}`}
                        className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl  hover:bg-white hover:shadow-sm transition-all group"
                      >
                        <span className="flex-1 text-[11px] sm:text-sm text-gray-700 group-hover:text-violet-600 truncate transition-colors">
                          {q.title}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            removeCodeFavorite(q.id);
                          }}
                          className="shrink-0 sm:px-2 sm:py-0.5 sm:rounded-lg sm:border sm:border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all"
                        >
                          <StarFilledIcon size={iconSize.sm} className="sm:hidden" />
                          <span className="hidden sm:inline text-xs">取消收藏</span>
                        </button>
                      </Link>
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
      <div className="mb-3 sm:mb-4 flex justify-center text-gray-400">
        {type === 'bagu' ? <BookOpenIcon size={iconSize.placeholder} /> : <RocketIcon size={iconSize.placeholder} />}
      </div>
      <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">暂无收藏的{type === 'bagu' ? '八股题' : '刷题'}题目</p>
      <Link
        href={type === 'bagu' ? '/bagu' : '/code-editor'}
        className={`btn-gradient-border ${type === 'bagu' ? 'btn-gradient-bagu' : 'btn-gradient-code'} inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all`}
      >
        {type === 'bagu' ? <BookOpenIcon size={iconSize.sm} /> : <RocketIcon size={iconSize.sm} />}
        去{type === 'bagu' ? '看八股题' : '刷题'}
      </Link>
    </div>
  );
}

