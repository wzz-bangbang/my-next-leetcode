'use client';

import { useEffect } from 'react';
import { Collapse } from '@mantine/core';
import type { BaguCategory, BaguQuestion } from '@/types/bagu';

interface QuestionListProps {
  categories: BaguCategory[];
  selectedQuestion: BaguQuestion | null;
  expandedCategories: Set<string>;
  completedQuestions: Set<string>;
  onSelectQuestion: (question: BaguQuestion, categoryId: string) => void;
  onToggleCategory: (categoryId: string) => void;
}

// 分类图标映射
const CategoryIcon: Record<string, string> = {
  'js-basic': '🟨',
  typescript: '🔷',
  'css-html': '🎨',
  react: '⚛️',
  vue: '🇻',
  browser: '🌐',
  network: '🔗',
  node: '🇳',
  nextjs: '▲',
  engineering: '⚙️',
  cicd: '🔄',
  'code-explain': '🔍',
  'open-questions': '💡',
  miniprogram: '📱',
  ai: '🤖',
  'tech-selection': '🎯',
  projects: '📁',
  teamwork: '👥',
  'interview-tips': '💼',
  'career-plan': '🚀',
  history: '📜',
};

export default function QuestionList({
  categories,
  selectedQuestion,
  expandedCategories,
  completedQuestions,
  onSelectQuestion,
  onToggleCategory,
}: QuestionListProps) {

  // 键盘导航
  useEffect(() => {
      // 获取所有题目的扁平列表（用于键盘导航）
    const getAllQuestions = () => {
      const result: { question: BaguQuestion; categoryId: string }[] = [];
      for (const category of categories) {
        for (const question of category.questions) {
          result.push({ question, categoryId: category.id });
        }
      }
      return result;
    };
    
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

      const allQuestions = getAllQuestions();
      if (allQuestions.length === 0) return;

      // 找到当前选中题目的索引
      const currentIndex = selectedQuestion
        ? allQuestions.findIndex((q) => q.question.id === selectedQuestion.id)
        : -1;

      let newIndex: number;
      if (e.key === 'ArrowUp') {
        // 上一题（到头不循环）
        if (currentIndex <= 0) return;
        newIndex = currentIndex - 1;
      } else {
        // 下一题（到尾不循环）
        if (currentIndex >= allQuestions.length - 1) return;
        newIndex = currentIndex + 1;
      }

      const { question, categoryId } = allQuestions[newIndex];
      
      // 自动展开目标分类
      if (!expandedCategories.has(categoryId)) {
        onToggleCategory(categoryId);
      }
      
      onSelectQuestion(question, categoryId);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedQuestion, expandedCategories, onSelectQuestion, onToggleCategory]);

  return (
    <div className="py-1">
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const hasQuestions = category.questions.length > 0;
        const completedCount = category.questions.filter((q) =>
          completedQuestions.has(q.id)
        ).length;

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
                  const isSelected = selectedQuestion?.id === question.id;
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

