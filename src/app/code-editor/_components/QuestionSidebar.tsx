'use client';

import React, { useEffect, useState, forwardRef } from 'react';
import { Collapse, Tooltip } from '@mantine/core';
import { CategoryTag, CategoryTagLabel, Difficulty, DifficultyLabel, DifficultyColor, QuestionListItem } from '@/types/question';
import {
  QuestionStatus,
  getQuestionStatusMap,
  setQuestionStatus as setStatusToServer,
  loadQuestionStatusFromServer,
  isStatusCacheLoaded,
} from '@/lib/questionStatus';

// 重新导出给外部使用
export { QuestionStatus, getQuestionStatusMap };
export const setQuestionStatus = setStatusToServer;

// 分类图标
const CategoryIcon: Partial<Record<CategoryTag, string>> = {
  [CategoryTag.JS_ANALYSIS]: '🔍',
  [CategoryTag.JS_HANDWRITE]: '✍️',
  [CategoryTag.TS_TYPES]: '📘',
  [CategoryTag.REACT]: '⚛️',
  // [CategoryTag.HTML_CSS]: '🎨', // 暂未启用
  [CategoryTag.ALGORITHM]: '🧮',
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
}, ref) => {
  const [statusMap, setStatusMap] = useState<Record<number, QuestionStatus>>({});

  // 加载状态数据（从服务器）
  useEffect(() => {
    const loadStatus = async () => {
      if (!isStatusCacheLoaded('code')) {
        await loadQuestionStatusFromServer('code');
      }
      setStatusMap(getQuestionStatusMap('code'));
    };
    loadStatus();
  }, []);

  // 定时刷新状态（可选，用于多标签页同步）
  useEffect(() => {
    const refreshStatus = () => {
      setStatusMap(getQuestionStatusMap('code'));
    };

    // 每次组件重新渲染时刷新
    refreshStatus();
  });

  const getStatus = (questionId: number): QuestionStatus => {
    return statusMap[questionId] ?? QuestionStatus.NOT_DONE;
  };

  return (
    <div
      className={`flex-shrink-0 backdrop-blur-md border-r border-purple-200/50 flex flex-col min-h-0 transition-all duration-300 ${
        collapsed ? 'w-[48px]' : 'w-[240px]'
      }`}
      style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0.15) 0%, rgba(167,139,250,0.1) 100%)' }}
    >
      {/* 头部 */}
      <div className="px-3 py-3 border-b border-purple-200/50 bg-white/20 flex-shrink-0 flex items-center justify-between">
        {!collapsed && <h2 className="text-sm font-semibold text-purple-700">📚 题目分类</h2>}
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

      {/* 折叠状态下显示简化图标列表 */}
      {collapsed ? (
        <div className="flex-1 min-h-0 overflow-y-auto py-2">
          {Object.values(CategoryTag).filter(v => typeof v === 'number').map((tag) => {
            const categoryQuestions = questionsByCategory.get(tag as CategoryTag) || [];
            const hasQuestions = categoryQuestions.length > 0;

            return hasQuestions ? (
              <Tooltip key={tag} label={CategoryTagLabel[tag as CategoryTag]} position="right" withArrow>
                <button
                  onClick={() => {
                    onToggleCollapse?.();
                    setTimeout(() => onToggleCategory(tag as CategoryTag), 100);
                  }}
                  className="w-full flex justify-center py-2.5 text-lg hover:bg-white/40 transition-colors"
                >
                  {CategoryIcon[tag as CategoryTag]}
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
              const categoryQuestions = questionsByCategory.get(tag as CategoryTag) || [];
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
                      <span>{CategoryIcon[tag as CategoryTag]}</span>
                      <span>{CategoryTagLabel[tag as CategoryTag]}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">({categoryQuestions.length})</span>
                      {hasQuestions && (
                        <span className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
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
                              className={`w-full text-left pl-10 pr-2 py-2 text-sm transition-all duration-200 flex items-center gap-1 outline-none focus:outline-none ${
                                isSelected
                                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
                                  : 'text-gray-600 hover:bg-white/50'
                              }`}
                            >
                              {/* 题目标题 */}
                              <span className="truncate flex-1 min-w-0">{q.title}</span>

                              {/* 难度标签 */}
                              <span
                                className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                                style={{
                                  backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${DifficultyColor[q.difficulty as Difficulty]}20`,
                                  color: isSelected ? 'white' : DifficultyColor[q.difficulty as Difficulty]
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

