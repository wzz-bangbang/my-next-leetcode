'use client';

import { useEffect, useRef, useMemo } from 'react';
import { scrollToSelected } from '@/hooks/useQuestionRoute';
import QuestionList from './QuestionList';
import SimulationModal from './SimulationModal';
import type { BaguListData, BaguCategory, BaguQuestionListItem } from '@/types/bagu';

interface BaguSidebarProps {
  data: BaguListData;
  filteredCategories: BaguCategory[];
  selectedQuestionId: number | null;
  expandedCategories: Set<number>;
  completedQuestions: Set<number>;
  isSidebarOpen: boolean;
  showIncomplete: boolean;
  showFavorited: boolean;
  onCloseSidebar: () => void;
  onSelectQuestion: (question: BaguQuestionListItem, categoryId: number) => void;
  onToggleCategory: (categoryId: number) => void;
  onToggleIncomplete: () => void;
  onToggleFavorited: () => void;
  onGoToPrev: () => void;
  onGoToNext: () => void;
}

export default function BaguSidebar({
  data,
  filteredCategories,
  selectedQuestionId,
  expandedCategories,
  completedQuestions,
  isSidebarOpen,
  showIncomplete,
  showFavorited,
  onCloseSidebar,
  onSelectQuestion,
  onToggleCategory,
  onToggleIncomplete,
  onToggleFavorited,
  onGoToPrev,
  onGoToNext,
}: BaguSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 统计信息（内部计算）
  const stats = useMemo(() => {
    const total = data.categories.reduce((sum, cat) => sum + cat.questions.length, 0);
    const completed = data.categories.reduce(
      (sum, cat) => sum + cat.questions.filter((q) => completedQuestions.has(q.id)).length,
      0
    );
    return { total, completed };
  }, [data, completedQuestions]);

  // 触摸滑动关闭侧边栏（内部处理）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startX = 0;
    let currentX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      currentX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentX = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const deltaX = currentX - startX;
      if (deltaX < -80 && isSidebarOpen) {
        onCloseSidebar();
      }
      startX = 0;
      currentX = 0;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSidebarOpen, onCloseSidebar]);

  // 切换题目时滚动到选中项（内部处理）
  useEffect(() => {
    if (selectedQuestionId) {
      setTimeout(() => {
        scrollToSelected(sidebarRef.current, String(selectedQuestionId));
      }, 100);
    }
  }, [selectedQuestionId]);

  // 展开分类（供 SimulationModal 调用）
  const handleExpandCategory = (categoryId: number) => {
    if (!expandedCategories.has(categoryId)) {
      onToggleCategory(categoryId);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`
        fixed md:relative inset-y-0 left-0 z-30
        w-[75%] sm:w-[280px] md:w-[32%] md:min-w-[260px] md:max-w-[400px]
        shrink-0 border-r border-purple-200/50 flex flex-col min-h-0
        transform transition-transform duration-300 ease-in-out bg-white
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      style={{
        background:
          'linear-gradient(180deg, rgba(139,92,246,0.15) 0%, rgba(167,139,250,0.1) 100%), #ffffff',
      }}
    >
      {/* 移动端顶部占位 */}
      <div className="md:hidden h-[49px] shrink-0 border-b border-purple-200/30" />

      {/* 标题和统计 */}
      <div className="px-3 md:px-4 py-2 md:py-3 border-b border-purple-200/50 bg-white/20 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs md:text-sm font-semibold text-purple-700 mb-0.5 md:mb-1">
              📚 八股文题库
            </h2>
            <div className="text-[10px] md:text-xs text-gray-500">
              共 {stats.total} 题 · 已完成 {stats.completed} 题
            </div>
          </div>
          <button
            className="md:hidden p-1.5 rounded-full hover:bg-purple-100 text-gray-600"
            onClick={onCloseSidebar}
          >
            ✕
          </button>
        </div>

        {/* 随机模拟按钮 */}
        <SimulationModal
          data={data}
          filteredCategories={filteredCategories}
          showIncomplete={showIncomplete}
          showFavorited={showFavorited}
          onSelectQuestion={onSelectQuestion}
          onExpandCategory={handleExpandCategory}
          expandedCategories={expandedCategories}
        />

        {/* 过滤按钮 */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={onToggleIncomplete}
            className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-all ${
              showIncomplete
                ? 'bg-amber-500 text-white'
                : 'bg-white/60 text-gray-600 hover:bg-white/80'
            }`}
          >
            {showIncomplete ? '✓ ' : ''}未完成
          </button>
          <button
            onClick={onToggleFavorited}
            className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-all ${
              showFavorited
                ? 'bg-yellow-500 text-white'
                : 'bg-white/60 text-gray-600 hover:bg-white/80'
            }`}
          >
            {showFavorited ? '✓ ' : ''}已收藏
          </button>
        </div>
      </div>

      {/* 分类列表 */}
      <div ref={sidebarRef} className="flex-1 min-h-0 overflow-y-auto">
        <QuestionList
          categories={filteredCategories}
          selectedQuestionId={selectedQuestionId}
          expandedCategories={expandedCategories}
          completedQuestions={completedQuestions}
          onSelectQuestion={onSelectQuestion}
          onToggleCategory={onToggleCategory}
          onGoToPrev={onGoToPrev}
          onGoToNext={onGoToNext}
        />
      </div>
    </div>
  );
}
