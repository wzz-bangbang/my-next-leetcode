'use client';

import React, { useMemo, useState, forwardRef } from 'react';
import type { ComponentType } from 'react';
import { Collapse, Tooltip } from '@mantine/core';
import { CategoryTag, CategoryTagLabel, Difficulty, DifficultyLabel, DifficultyColor, QuestionListItem } from '@/types/question';
import {
  QuestionStatus,
  setQuestionStatus as setStatusToServer,
} from '@/lib/questionStatus';
import {
  JsAnalysisIcon,
  JsHandwriteIcon,
  TsTypeIcon,
  ReactIcon,
  AlgorithmIcon,
  BookOpenIcon,
  ChevronRightIcon,
  CheckIcon,
  type IconProps,
} from '@/components/icons';
import { iconSize } from '@/styles/theme';

// 重新导出给外部使用
export { QuestionStatus };
export const setQuestionStatus = setStatusToServer;

// 分类图标
const CategoryIconMap: Partial<Record<CategoryTag, ComponentType<IconProps>>> = {
  [CategoryTag.JS_ANALYSIS]: JsAnalysisIcon,
  [CategoryTag.JS_HANDWRITE]: JsHandwriteIcon,
  [CategoryTag.TS_TYPES]: TsTypeIcon,
  [CategoryTag.REACT]: ReactIcon,
  // [CategoryTag.HTML_CSS]: CssHtmlIcon, // 暂未启用
  [CategoryTag.ALGORITHM]: AlgorithmIcon,
};

interface QuestionSidebarProps {
  questions: QuestionListItem[];
  questionsByCategory: Map<CategoryTag, QuestionListItem[]>;
  selectedQuestionId: number | null;
  selectedCategoryTag: CategoryTag | null;
  expandedCategories: Set<CategoryTag>;
  onSelectQuestion: (id: number, categoryTag: CategoryTag) => void;
  onToggleCategory: (tag: CategoryTag) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  statusMap: Record<number, QuestionStatus>;
  favoriteQuestions: Set<number>;
}

const QuestionSidebar = forwardRef<HTMLDivElement, QuestionSidebarProps>(({
  questions: _questions,
  questionsByCategory,
  selectedQuestionId,
  selectedCategoryTag,
  expandedCategories,
  onSelectQuestion,
  onToggleCategory,
  collapsed = false,
  onToggleCollapse,
  statusMap,
  favoriteQuestions,
}, ref) => {
  // 筛选状态
  const [showIncomplete, setShowIncomplete] = useState(false);
  const [showFavorited, setShowFavorited] = useState(false);
  const [difficultyFilters, setDifficultyFilters] = useState<Set<Difficulty>>(new Set());

  const getStatus = (questionId: number): QuestionStatus => {
    return statusMap[questionId] ?? QuestionStatus.NOT_DONE;
  };

  // 切换难度筛选
  const toggleDifficulty = (difficulty: Difficulty) => {
    setDifficultyFilters(prev => {
      const next = new Set(prev);
      if (next.has(difficulty)) {
        next.delete(difficulty);
      } else {
        next.add(difficulty);
      }
      return next;
    });
  };

  // 筛选后的题目（按分类）
  const filteredQuestionsByCategory = useMemo(() => {
    const hasFilters = showIncomplete || showFavorited || difficultyFilters.size > 0;
    if (!hasFilters) return questionsByCategory;

    const filtered = new Map<CategoryTag, QuestionListItem[]>();
    questionsByCategory.forEach((questions, tag) => {
      const filteredQuestions = questions.filter(q => {
        // 未完成筛选
        const incompleteMatch = !showIncomplete || getStatus(q.id) !== QuestionStatus.SOLVED;
        // 已收藏筛选
        const favoritedMatch = !showFavorited || favoriteQuestions.has(q.id);
        // 难度筛选
        const difficultyMatch = difficultyFilters.size === 0 || difficultyFilters.has(q.difficulty as Difficulty);
        return incompleteMatch && favoritedMatch && difficultyMatch;
      });
      if (filteredQuestions.length > 0) {
        filtered.set(tag, filteredQuestions);
      }
    });
    return filtered;
  }, [questionsByCategory, showIncomplete, showFavorited, difficultyFilters, statusMap, favoriteQuestions]);

  // 统计信息（基于筛选后的数据）
  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;
    filteredQuestionsByCategory.forEach(questions => {
      total += questions.length;
      completed += questions.filter(q => getStatus(q.id) === QuestionStatus.SOLVED).length;
    });
    return { total, completed };
  }, [filteredQuestionsByCategory, statusMap]);

  const hasFilters = showIncomplete || showFavorited || difficultyFilters.size > 0;

  return (
    <div
      className={`flex-shrink-0 backdrop-blur-md border-r border-purple-200/50 flex flex-col min-h-0 transition-all duration-300 ${
        collapsed ? 'w-[48px]' : 'w-[240px]'
      }`}
      style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0.05) 0%, rgba(167,139,250,0.03) 100%), #ffffff' }}
    >
      {/* 头部 */}
      <div className="px-4 py-3 border-b border-purple-200/50 bg-white/20 shrink-0">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="text-sm font-semibold text-purple-700 mb-0.5 flex items-center gap-1.5">
                <BookOpenIcon size={iconSize.md} />
                代码题题库
              </h2>
              <div className="text-xs text-gray-500">
                共 {stats.total} 题 · 已完成 {stats.completed} 题
              </div>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md hover:bg-white/40 transition-colors text-purple-600"
            title={collapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
              <polyline points="14 9 17 12 14 15"></polyline>
            </svg>
          </button>
        </div>

        {/* 筛选按钮 */}
        {!collapsed && (
          <div className="space-y-2 mt-2.5">
            {/* 第一行：难度筛选 */}
            <div className="flex gap-1">
              <button
                onClick={() => toggleDifficulty(Difficulty.EASY)}
                className={`btn-gradient-border flex-1 py-1.5 text-xs sm:text-sm rounded-full transition-all ${
                  difficultyFilters.has(Difficulty.EASY)
                    ? 'active'
                    : ''
                }`}
                style={{
                  '--btn-gradient': `linear-gradient(135deg, ${DifficultyColor[Difficulty.EASY]} 0%, ${DifficultyColor[Difficulty.EASY]} 100%)`,
                  backgroundColor: difficultyFilters.has(Difficulty.EASY) ? `${DifficultyColor[Difficulty.EASY]}1a` : undefined,
                  color: DifficultyColor[Difficulty.EASY],
                } as React.CSSProperties}
              >
                简单
              </button>
              <button
                onClick={() => toggleDifficulty(Difficulty.MEDIUM)}
                className={`btn-gradient-border flex-1 py-1.5 text-xs sm:text-sm rounded-full transition-all ${
                  difficultyFilters.has(Difficulty.MEDIUM)
                    ? 'active'
                    : ''
                }`}
                style={{
                  '--btn-gradient': `linear-gradient(135deg, ${DifficultyColor[Difficulty.MEDIUM]} 0%, ${DifficultyColor[Difficulty.MEDIUM]} 100%)`,
                  backgroundColor: difficultyFilters.has(Difficulty.MEDIUM) ? `${DifficultyColor[Difficulty.MEDIUM]}1a` : undefined,
                  color: DifficultyColor[Difficulty.MEDIUM],
                } as React.CSSProperties}
              >
                中等
              </button>
              <button
                onClick={() => toggleDifficulty(Difficulty.HARD)}
                className={`btn-gradient-border flex-1 py-1.5 text-xs sm:text-sm rounded-full transition-all ${
                  difficultyFilters.has(Difficulty.HARD)
                    ? 'active'
                    : ''
                }`}
                style={{
                  '--btn-gradient': `linear-gradient(135deg, ${DifficultyColor[Difficulty.HARD]} 0%, ${DifficultyColor[Difficulty.HARD]} 100%)`,
                  backgroundColor: difficultyFilters.has(Difficulty.HARD) ? `${DifficultyColor[Difficulty.HARD]}1a` : undefined,
                  color: DifficultyColor[Difficulty.HARD],
                } as React.CSSProperties}
              >
                困难
              </button>
            </div>
            {/* 第二行：未完成 + 已收藏 */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowIncomplete(prev => !prev)}
                data-active={showIncomplete}
                className={`btn-gradient-border btn-gradient-complete flex-1 px-3 py-1.5 text-xs sm:text-sm rounded-full transition-all flex items-center justify-center gap-1 ${
                  showIncomplete
                    ? 'active'
                    : ''
                }`}
                style={{
                  backgroundColor: showIncomplete ? 'rgba(34, 197, 94, 0.1)' : undefined,
                }}
              >
                {showIncomplete && <CheckIcon size={iconSize.sm} />}
                未完成
              </button>
              <button
                onClick={() => setShowFavorited(prev => !prev)}
                data-active={showFavorited}
                className={`btn-gradient-border btn-gradient-star flex-1 px-3 py-1.5 text-xs sm:text-sm rounded-full transition-all flex items-center justify-center gap-1 ${
                  showFavorited
                    ? 'active'
                    : ''
                }`}
                style={{
                  backgroundColor: showFavorited ? 'rgba(251, 191, 36, 0.1)' : undefined,
                }}
              >
                {showFavorited && <CheckIcon size={iconSize.sm} />}
                已收藏
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 折叠状态下显示简化图标列表 */}
      {collapsed ? (
        <div className="flex-1 min-h-0 overflow-y-auto py-2">
          {Object.values(CategoryTag).filter(v => typeof v === 'number').map((tag) => {
            const categoryQuestions = filteredQuestionsByCategory.get(tag as CategoryTag) || [];
            const hasQuestions = categoryQuestions.length > 0;

            return hasQuestions ? (
              <Tooltip key={tag} label={CategoryTagLabel[tag as CategoryTag]} position="right" withArrow>
                <button
                  onClick={() => {
                    onToggleCollapse?.();
                    setTimeout(() => onToggleCategory(tag as CategoryTag), 100);
                  }}
                  className="w-full flex justify-center py-2.5 hover:bg-white/40 transition-colors"
                >
                  {(() => {
                    const IconComponent = CategoryIconMap[tag as CategoryTag];
                    return IconComponent ? <IconComponent size={iconSize.lg - 2} /> : null;
                  })()}
                </button>
              </Tooltip>
            ) : null;
          })}
        </div>
      ) : (
        /* 展开状态下显示完整列表 */
        <div ref={ref} className="flex-1 min-h-0 overflow-y-auto">
          <div className="py-1">
            {Object.values(CategoryTag).filter(v => typeof v === 'number').map((tag) => {
              const categoryQuestions = filteredQuestionsByCategory.get(tag as CategoryTag) || [];
              const isExpanded = expandedCategories.has(tag as CategoryTag);
              const hasQuestions = categoryQuestions.length > 0;

              return (
                <div key={tag} className="mb-0.5">
                  {/* 分类标题 */}
                  <button
                    onClick={() => hasQuestions && onToggleCategory(tag as CategoryTag)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center justify-between transition-colors outline-none focus:outline-none ${
                      hasQuestions
                        ? 'hover:bg-white/40 cursor-pointer text-gray-700'
                        : 'text-gray-400 cursor-default'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {(() => {
                        const IconComponent = CategoryIconMap[tag as CategoryTag];
                        return IconComponent ? <IconComponent size={iconSize.md} /> : null;
                      })()}
                      <span>{CategoryTagLabel[tag as CategoryTag]}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">({categoryQuestions.length})</span>
                      {hasQuestions && (
                        <span className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                          <ChevronRightIcon size={iconSize.xs} />
                        </span>
                      )}
                    </span>
                  </button>

                  {/* 题目列表 */}
                  <Collapse in={isExpanded}>
                    <div className="bg-white/20">
                      {categoryQuestions.map((q) => {
                        const categoryTag = tag as CategoryTag;
                        const isSelected = selectedQuestionId === q.id && selectedCategoryTag === categoryTag;
                        const questionKey = `${categoryTag}-${q.id}`;

                        return (
                          <Tooltip
                            key={questionKey}
                            label={q.title}
                            position="right"
                            withArrow
                            multiline
                            w={220}
                            openDelay={500}
                            disabled={q.title.length < 15}
                          >
                            <button
                              data-question-id={q.id}
                              data-question-key={questionKey}
                              onClick={() => onSelectQuestion(q.id, categoryTag)}
                              className={`item-gradient-border item-gradient-code w-full text-left pl-10 pr-3 py-2 text-sm transition-all duration-200 flex items-center gap-2 outline-none focus:outline-none ${
                                isSelected
                                  ? 'active font-medium text-indigo-700'
                                  : 'text-gray-600 hover:bg-white/50'
                              }`}
                            >
                              {/* 题目标题 */}
                              <span className="truncate flex-1 min-w-0">{q.title}</span>

                              {/* 难度标签 */}
                              <span
                                className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                                style={{
                                  backgroundColor: `${DifficultyColor[q.difficulty as Difficulty]}20`,
                                  color: DifficultyColor[q.difficulty as Difficulty]
                                }}
                              >
                                {DifficultyLabel[q.difficulty as Difficulty]}
                              </span>
                            </button>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </Collapse>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

QuestionSidebar.displayName = 'QuestionSidebar';

export default QuestionSidebar;
