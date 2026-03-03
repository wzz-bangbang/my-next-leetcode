'use client';

import { useEffect } from 'react';
import { Collapse } from '@mantine/core';
import type { BaguCategory, BaguQuestionListItem } from '@/types/bagu';

interface QuestionListProps {
  categories: BaguCategory[];
  selectedQuestionId: number | null;
  expandedCategories: Set<number>;
  completedQuestions: Set<number>;
  onSelectQuestion: (question: BaguQuestionListItem, categoryId: number) => void;
  onToggleCategory: (categoryId: number) => void;
  onGoToPrev?: () => void;
  onGoToNext?: () => void;
}

// 分类图标映射（按数字ID）
const CategoryIcon: Record<number, string> = {
  1: '🟨',  // JS基础
  2: '🔷',  // TypeScript
  3: '🎨',  // CSS & HTML
  4: '⚛️',  // React
  5: '🇻',   // Vue
  6: '🌐',  // 浏览器
  7: '▲',   // Next.js
  8: '⚙️',  // 工程化
  9: '🔄',  // CI&CD
  10: '💡', // 开放题&场景题
  11: '📱', // 小程序
  12: '🤖', // AI
  13: '🎯', // 技术选型
  14: '👥', // 工作协作
};

export default function QuestionList({
  categories,
  selectedQuestionId,
  expandedCategories,
  completedQuestions,
  onSelectQuestion,
  onToggleCategory,
  onGoToPrev,
  onGoToNext,
}: QuestionListProps) {

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果在输入框内，不处理
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
        return;
      }

      e.preventDefault();

      if (e.key === 'ArrowUp') {
        onGoToPrev?.();
      } else {
        onGoToNext?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onGoToPrev, onGoToNext]);

  return (
    <div className="py-1">
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const hasQuestions = category.questions.length > 0;
        // const completedCount = category.questions.filter((q) =>
        //   completedQuestions.has(q.id)
        // ).length;

        return (
          <div key={category.id} className="mb-0.5">
            {/* 分类标题 */}
            <button
              onClick={() => hasQuestions && onToggleCategory(category.id)}
              className={`w-full text-left px-4 py-2.5 !text-[0.9375rem] font-medium flex items-center justify-between transition-colors outline-none focus:outline-none ${
                hasQuestions
                  ? 'hover:bg-white/40 cursor-pointer text-gray-700'
                  : 'text-gray-400 cursor-default'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{CategoryIcon[category.id] || '📄'}</span>
                <span>{category.name}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {category.questions.length}
                </span>
                {hasQuestions && (
                  <span
                    className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  >
                    ▶
                  </span>
                )}
              </span>
            </button>

            {/* 题目列表 */}
            <Collapse in={isExpanded}>
              <div className="bg-white/20">
                {category.questions.map((question) => {
                  const isSelected = selectedQuestionId === question.id;
                  // const isCompleted = completedQuestions.has(question.id);

                  return (
                    // <Tooltip
                    //   key={question.id}
                    //   label={question.title}
                    //   position="right"
                    //   withArrow
                    //   multiline
                    //   w={250}
                    //   openDelay={500}
                    //   disabled={question.title.length < 20}
                    // >
                      <button
                        key={question.id}
                        data-question-id={question.id}
                        onClick={() => onSelectQuestion(question, category.id)}
                        className={`w-full text-left pl-10 pr-3 py-2 !text-[0.875rem] transition-all duration-200 flex items-center gap-2 outline-none focus:outline-none ${
                          isSelected
                            ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
                            : 'text-gray-600 hover:bg-white/50'
                        }`}
                      >
                        {/* 完成状态图标 */}
                        {/* <Tooltip
                          label={isCompleted ? '已完成' : '未完成'}
                          position="top"
                          withArrow
                          openDelay={300}
                        >
                          <span
                            className="flex-shrink-0 text-xs cursor-help"
                            style={{
                              color: isSelected
                                ? 'rgba(255,255,255,0.8)'
                                : isCompleted
                                  ? '#22c55e'
                                  : '#9ca3af',
                            }}
                          >
                            {isCompleted ? '●' : '○'}
                          </span>
                        </Tooltip> */}

                        {/* 题目标题 */}
                        <span className="truncate flex-1 min-w-0">
                          {question.title}
                        </span>
                      </button>
                    // </Tooltip>
                  );
                })}
              </div>
            </Collapse>
          </div>
        );
      })}
    </div>
  );
}

