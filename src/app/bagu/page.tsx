'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Tooltip, Button, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import Header from '@/components/Header';
import { getBaguData, getCachedBaguData } from '@/lib/bagu-data';
import { useQuestionRoute, scrollToSelected } from '@/hooks/useQuestionRoute';
import { getFavorites, toggleFavorite, loadFavoritesFromServer } from '@/lib/favorites';
import MarkdownContent from './_components/MarkdownContent';
import QuestionList from './_components/QuestionList';
import SimulationModal from './_components/SimulationModal';
import type { BaguData, BaguQuestion } from '@/types/bagu';

// localStorage key
const BAGU_COMPLETED_KEY = 'bagu-completed-questions';

// 获取已完成的题目
function getCompletedQuestions(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const data = localStorage.getItem(BAGU_COMPLETED_KEY);
    return new Set(data ? JSON.parse(data) : []);
  } catch {
    return new Set();
  }
}

// 设置题目完成状态
function setQuestionCompleted(questionId: string, completed: boolean) {
  if (typeof window === 'undefined') return;
  const set = getCompletedQuestions();
  if (completed) {
    set.add(questionId);
  } else {
    set.delete(questionId);
  }
  localStorage.setItem(BAGU_COMPLETED_KEY, JSON.stringify([...set]));
}

// 复制到剪贴板
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    notifications.show({ autoClose: 1500,
      title: '已复制',
      message: '标题已复制到剪贴板',
      color: 'blue',
    });
  } catch {
    notifications.show({ autoClose: 1500,
      title: '复制失败',
      message: '请手动复制',
      color: 'red',
    });
  }
}

export default function BaguPage() {
  // 数据状态 - 优先使用缓存
  const [data, setData] = useState<BaguData | null>(() => getCachedBaguData());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedQuestion, setSelectedQuestion] = useState<BaguQuestion | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [favoriteQuestions, setFavoriteQuestions] = useState<Set<string>>(new Set());
  const sidebarRef = useRef<HTMLDivElement>(null);
  const sidebarTouchRef = useRef<HTMLDivElement>(null);
  
  // 移动端侧边栏状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 过滤模式：all-全部, incomplete-未完成, favorited-已收藏
  const [filterMode, setFilterMode] = useState<'all' | 'incomplete' | 'favorited'>('all');
  
  // 触摸滑动关闭侧边栏
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  
  useEffect(() => {
    const sidebarEl = sidebarTouchRef.current;
    if (!sidebarEl) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchCurrentX.current = e.touches[0].clientX;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      touchCurrentX.current = e.touches[0].clientX;
    };
    
    const handleTouchEnd = () => {
      const deltaX = touchCurrentX.current - touchStartX.current;
      // 左滑超过 80px 则关闭
      if (deltaX < -80 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
      touchStartX.current = 0;
      touchCurrentX.current = 0;
    };
    
    sidebarEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    sidebarEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    sidebarEl.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      sidebarEl.removeEventListener('touchstart', handleTouchStart);
      sidebarEl.removeEventListener('touchmove', handleTouchMove);
      sidebarEl.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSidebarOpen]);

  // 获取所有题目的扁平列表（提前计算，供 hook 使用）
  const allQuestions = useMemo(() => {
    if (!data) return [];
    const result: { question: BaguQuestion; categoryId: string }[] = [];
    for (const category of data.categories) {
      for (const question of category.questions) {
        result.push({ question, categoryId: category.id });
      }
    }
    return result;
  }, [data]);

  // 选择题目（带自动展开分类）
  const selectQuestionWithExpand = useCallback(
    (item: { question: BaguQuestion; categoryId: string }) => {
      const { question, categoryId } = item;
      setSelectedQuestion(question);
      setSelectedCategoryId(categoryId);
      // 自动展开分类
      setExpandedCategories((prev) => {
        if (prev.has(categoryId)) return prev;
        return new Set([...prev, categoryId]);
      });
    },
    []
  );

  // 选择第一题
  const selectFirstQuestion = useCallback(() => {
    if (allQuestions.length > 0) {
      selectQuestionWithExpand(allQuestions[0]);
    }
  }, [allQuestions, selectQuestionWithExpand]);

  // URL 路由同步
  useQuestionRoute({
    questions: allQuestions,
    getKey: (item) => item.question.id,
    selectedKey: selectedQuestion?.id || null,
    onSelect: selectQuestionWithExpand,
    onSelectFirst: selectFirstQuestion,
    paramName: 'q',
  });

  // 加载数据
  useEffect(() => {
    // 加载完成状态
    setCompletedQuestions(getCompletedQuestions());
    
    // 加载收藏状态
    setFavoriteQuestions(getFavorites('bagu'));
    loadFavoritesFromServer('bagu').then(setFavoriteQuestions);

    // 如果没有缓存数据，异步加载
    if (!getCachedBaguData()) {
      getBaguData().then((loadedData) => {
        setData(loadedData);
      });
    }
  }, []);

  // 切换分类展开状态
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  // 选择题目
  const selectQuestion = useCallback((question: BaguQuestion, categoryId: string) => {
    setSelectedQuestion(question);
    setSelectedCategoryId(categoryId);
    // 移动端选择后收起侧边栏
    setIsSidebarOpen(false);
  }, []);

  // 切换题目时滚动侧边栏
  useEffect(() => {
    if (selectedQuestion) {
      // 延迟执行，等待分类展开动画完成
      setTimeout(() => {
        scrollToSelected(sidebarRef.current, selectedQuestion.id);
      }, 100);
    }
  }, [selectedQuestion]);

  // 标记为完成/未完成
  const toggleCompleted = useCallback(() => {
    if (!selectedQuestion) return;

    const isCompleted = completedQuestions.has(selectedQuestion.id);
    const newCompleted = !isCompleted;
    
    // 显示提示（移出setState回调）
    if (newCompleted) {
      notifications.show({ autoClose: 1500,
        title: '🎉 完成',
        message: '已标记为完成！',
        color: 'green',
      });
    } else {
      notifications.show({ autoClose: 1500,
        title: '已取消',
        message: '已取消完成标记',
        color: 'gray',
      });
    }

    setQuestionCompleted(selectedQuestion.id, newCompleted);

    setCompletedQuestions((prev) => {
      const next = new Set(prev);
      if (newCompleted) {
        next.add(selectedQuestion.id);
      } else {
        next.delete(selectedQuestion.id);
      }
      return next;
    });
  }, [selectedQuestion, completedQuestions]);

  // 获取当前分类
  const selectedCategory = useMemo(() => {
    if (!data || !selectedCategoryId) return null;
    return data.categories.find((c) => c.id === selectedCategoryId);
  }, [data, selectedCategoryId]);

  // 过滤后的分类数据
  const filteredCategories = useMemo(() => {
    if (!data) return [];
    if (filterMode === 'all')
      return data.categories;
    
    const newCategories = data.categories
      .map((cat) => ({
        ...cat,
        questions: cat.questions.filter((q) => {
          if (filterMode === 'incomplete') {
            return !completedQuestions.has(q.id);
          } else if (filterMode === 'favorited') {
            return favoriteQuestions.has(q.id);
          }
          return true;
        }),
      }))
      .filter((cat) => cat.questions.length > 0);
    return newCategories;
  }, [data, filterMode, completedQuestions, favoriteQuestions]);

  // 统计信息
  const stats = useMemo(() => {
    if (!data) return { total: 0, completed: 0 };
    const total = data.categories.reduce(
      (sum, cat) => sum + cat.questions.length,
      0
    );
    const completed = data.categories.reduce(
      (sum, cat) =>
        sum + cat.questions.filter((q) => completedQuestions.has(q.id)).length,
      0
    );
    return { total, completed };
  }, [data, completedQuestions]);

  // 当前题目是否已完成
  const isCurrentCompleted = selectedQuestion
    ? completedQuestions.has(selectedQuestion.id)
    : false;

  // 当前题目是否已收藏
  const isCurrentFavorited = selectedQuestion
    ? favoriteQuestions.has(selectedQuestion.id)
    : false;

  // 切换收藏状态
  const handleToggleFavorite = useCallback(() => {
    if (!selectedQuestion) return;

    const newStatus = toggleFavorite('bagu', selectedQuestion.id);
    
    setFavoriteQuestions((prev) => {
      const next = new Set(prev);
      if (newStatus) {
        next.add(selectedQuestion.id);
      } else {
        next.delete(selectedQuestion.id);
      }
      return next;
    });

    notifications.show({
      autoClose: 1500,
      title: newStatus ? '⭐ 已收藏' : '已取消收藏',
      message: newStatus ? '题目已添加到收藏' : '题目已从收藏中移除',
      color: newStatus ? 'yellow' : 'gray',
    });
  }, [selectedQuestion]);

  // 当前题目索引
  const currentIndex = useMemo(() => {
    if (!selectedQuestion) return -1;
    return allQuestions.findIndex((q) => q.question.id === selectedQuestion.id);
  }, [allQuestions, selectedQuestion]);

  // 是否是第一题/最后一题
  const isFirstQuestion = currentIndex <= 0;
  const isLastQuestion = currentIndex >= allQuestions.length - 1;

  // 上一题
  const goToPrev = useCallback(() => {
    if (allQuestions.length === 0 || currentIndex <= 0) return;
    const newIndex = currentIndex - 1;
    const { question, categoryId } = allQuestions[newIndex];
    
    if (!expandedCategories.has(categoryId)) {
      toggleCategory(categoryId);
    }
    selectQuestion(question, categoryId);
  }, [allQuestions, currentIndex, expandedCategories, toggleCategory, selectQuestion]);

  // 下一题
  const goToNext = useCallback(() => {
    if (allQuestions.length === 0 || currentIndex >= allQuestions.length - 1) return;
    const newIndex = currentIndex + 1;
    const { question, categoryId } = allQuestions[newIndex];
    
    if (!expandedCategories.has(categoryId)) {
      toggleCategory(categoryId);
    }
    selectQuestion(question, categoryId);
  }, [allQuestions, currentIndex, expandedCategories, toggleCategory, selectQuestion]);

  // 展开分类（供 SimulationModal 调用）
  const expandCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      if (prev.has(categoryId)) return prev;
      return new Set([...prev, categoryId]);
    });
  }, []);

  return (
    <div
      className="h-screen flex flex-col relative overflow-hidden"
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
      {/* 装饰性渐变圆形 */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(255,182,193,0.6) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-[30%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(135,206,250,0.6) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-[-10%] left-[30%] w-[450px] h-[450px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(152,251,152,0.5) 0%, transparent 70%)',
        }}
      />

      {/* 公共头部 */}
      <Header />

      {/* 主内容区域 */}
      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        {/* 左侧分类菜单 */}
        <div
          ref={sidebarTouchRef}
          className={`
            fixed md:relative inset-y-0 left-0 z-30
            w-[75%] sm:w-[280px] md:w-[32%] md:min-w-[260px] md:max-w-[400px]
            flex-shrink-0 border-r border-purple-200/50 flex flex-col min-h-0
            transform transition-transform duration-300 ease-in-out bg-white
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
          style={{
            background:
              'linear-gradient(180deg, rgba(139,92,246,0.15) 0%, rgba(167,139,250,0.1) 100%), #ffffff',
          }}
        >
          {/* 移动端顶部占位，与header高度一致 */}
          <div className="md:hidden h-[49px] flex-shrink-0 border-b border-purple-200/30" />
          
          {/* 标题和统计 */}
          <div className="px-3 md:px-4 py-2 md:py-3 border-b border-purple-200/50 bg-white/20 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs md:text-sm font-semibold text-purple-700 mb-0.5 md:mb-1">
                  📚 八股文题库
                </h2>
                <div className="text-[10px] md:text-xs text-gray-500">
                  共 {stats.total} 题 · 已完成 {stats.completed} 题
                </div>
              </div>
              {/* 移动端关闭按钮 */}
              <button
                className="md:hidden p-1.5 rounded-full hover:bg-purple-100 text-gray-600"
                onClick={() => setIsSidebarOpen(false)}
              >
                ✕
              </button>
            </div>
            {/* 随机模拟按钮 */}
            <SimulationModal
              data={data}
              onSelectQuestion={selectQuestion}
              onExpandCategory={expandCategory}
              expandedCategories={expandedCategories}
            />
            
            {/* 过滤按钮 */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setFilterMode(filterMode === 'incomplete' ? 'all' : 'incomplete')}
                className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-all ${
                  filterMode === 'incomplete'
                    ? 'bg-amber-500 text-white'
                    : 'bg-white/60 text-gray-600 hover:bg-white/80'
                }`}
              >
                {filterMode === 'incomplete' ? '✓ ' : ''}未完成
              </button>
              <button
                onClick={() => setFilterMode(filterMode === 'favorited' ? 'all' : 'favorited')}
                className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-all ${
                  filterMode === 'favorited'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white/60 text-gray-600 hover:bg-white/80'
                }`}
              >
                {filterMode === 'favorited' ? '✓ ' : ''}已收藏
              </button>
            </div>
          </div>

          {/* 分类列表 */}
          <div ref={sidebarRef} className="flex-1 min-h-0 overflow-y-auto">
            {data && (
              <QuestionList
                categories={filteredCategories}
                selectedQuestion={selectedQuestion}
                expandedCategories={expandedCategories}
                completedQuestions={completedQuestions}
                onSelectQuestion={selectQuestion}
                onToggleCategory={toggleCategory}
              />
            )}
          </div>
        </div>

        {/* 右侧内容区 */}
        <div className={`flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative ${isSidebarOpen ? 'md:opacity-100' : ''}`}>
          {/* 移动端遮罩层 - 只覆盖内容区 */}
          {isSidebarOpen && (
            <div
              className="md:hidden absolute inset-0 bg-black/40 z-20"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* 移动端题目选择栏 */}
          <div className="md:hidden flex-shrink-0 px-2 py-2 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/60 border border-purple-200/50 text-left"
            >
              <span className="text-purple-600 text-sm">☰</span>
              {selectedQuestion ? (
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 flex-shrink-0">{selectedCategory?.name}</span>
                  <span className="text-xs font-medium text-gray-800 truncate">{selectedQuestion.title}</span>
                </div>
              ) : (
                <span className="text-xs text-gray-500">选择题目</span>
              )}
              <span className="text-gray-400 text-[10px]">▼</span>
            </button>
          </div>

          {selectedQuestion ? (
            <>
              {/* 题目标题栏 - PC端 */}
              <div className="hidden md:block flex-shrink-0 px-6 py-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-600">
                    {selectedCategory?.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleToggleFavorite}
                      variant="light"
                      radius="xl"
                      size="xs"
                      color={isCurrentFavorited ? 'yellow' : 'gray'}
                    >
                      {isCurrentFavorited ? '⭐ 已收藏' : '☆ 收藏'}
                    </Button>
                    <Button
                      onClick={toggleCompleted}
                      variant="light"
                      radius="xl"
                      size="xs"
                      color={isCurrentCompleted ? 'green' : 'gray'}
                    >
                      {isCurrentCompleted ? '✅ 已完成' : '⏳ 标为完成'}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-800">
                    {selectedQuestion.title}
                  </h1>
                  <Tooltip label="复制标题" position="top" withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() => copyToClipboard(selectedQuestion.title)}
                    >
                      <span className="text-sm">📋</span>
                    </ActionIcon>
                  </Tooltip>
                </div>
              </div>

              {/* 内容区域 */}
              <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-6 pb-[60px] sm:pb-6 bg-white/30 backdrop-blur-sm flex flex-col">
                <div className="flex-1">
                  {selectedQuestion.content ? (
                    <MarkdownContent content={selectedQuestion.content} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <span className="text-3xl sm:text-4xl mb-3 sm:mb-4">📝</span>
                      <p className="text-xs sm:text-base">暂无答案，等待补充...</p>
                    </div>
                  )}
                </div>

                {/* PC端底部导航 - 只保留翻页和进度 */}
                <div className="hidden sm:block flex-shrink-0 pt-6 mt-6 border-t border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={goToPrev}
                      variant="light"
                      radius="xl"
                      size="xs"
                      color="violet"
                      disabled={isFirstQuestion}
                    >
                      <span className="text-xs">← 上一题</span>
                    </Button>

                    <span className="text-xs text-gray-400">
                      {currentIndex + 1} / {allQuestions.length}
                    </span>

                    <Button
                      onClick={goToNext}
                      variant="light"
                      radius="xl"
                      size="xs"
                      color="violet"
                      disabled={isLastQuestion}
                    >
                      <span className="text-xs">下一题 →</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* 移动端底部固定导航 */}
              <div className="sm:hidden absolute bottom-0 left-0 right-0 z-10 px-2 py-2.5 bg-white/95 backdrop-blur-sm border-t border-gray-200/50 flex items-center justify-between gap-1">
                <Button
                  onClick={goToPrev}
                  variant="light"
                  radius="xl"
                  size="xs"
                  color="violet"
                  disabled={isFirstQuestion}
                  className="!px-2 flex-shrink-0"
                >
                  <span className="text-[10px]">←</span>
                </Button>

                <Button
                  onClick={handleToggleFavorite}
                  variant="light"
                  radius="xl"
                  size="xs"
                  color={isCurrentFavorited ? 'yellow' : 'gray'}
                  className="!px-2 flex-shrink-0"
                >
                  <span className="text-[10px] whitespace-nowrap flex items-center gap-0.5">
                    <span>{isCurrentFavorited ? '⭐' : '☆'}</span>
                    <span>{isCurrentFavorited ? '已收藏' : '收藏'}</span>
                  </span>
                </Button>

                <Button
                  onClick={toggleCompleted}
                  variant="light"
                  radius="xl"
                  size="xs"
                  color={isCurrentCompleted ? 'green' : 'gray'}
                  className="!px-2 flex-shrink-0"
                >
                  <span className="text-[10px] whitespace-nowrap flex items-center gap-0.5">
                    <span>{isCurrentCompleted ? '✅' : '⏳'}</span>
                    <span>{isCurrentCompleted ? '完成' : '待完成'}</span>
                  </span>
                </Button>

                <Button
                  onClick={goToNext}
                  variant="light"
                  radius="xl"
                  size="xs"
                  color="violet"
                  disabled={isLastQuestion}
                  className="!px-2 flex-shrink-0"
                >
                  <span className="text-[10px]">→</span>
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-4 sm:p-6">
              <span className="text-4xl sm:text-6xl mb-3 sm:mb-4">📚</span>
              <p className="text-sm sm:text-lg text-center">
                <span className="md:hidden">点击上方选择题目</span>
                <span className="hidden md:inline">请从左侧选择一道题目</span>
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
