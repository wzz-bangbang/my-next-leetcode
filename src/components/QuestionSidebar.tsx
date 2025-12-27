'use client';

import React, { useEffect, useState } from 'react';
import { Collapse, Tooltip } from '@mantine/core';
import { CategoryTag, CategoryTagLabel, Difficulty, DifficultyLabel, DifficultyColor } from '@/types/question';

interface Question {
  id: string;
  title: string;
  difficulty: number;
  tags: number[];
  description?: string;
}

// 题目状态枚举
export enum QuestionStatus {
  NOT_DONE = 0,    // 没做过
  ATTEMPTED = 1,   // 做过
  SOLVED = 2,      // 已解决
}

// 状态图标
const StatusIcon: Record<QuestionStatus, { icon: string; color: string; label: string }> = {
  [QuestionStatus.NOT_DONE]: { icon: '○', color: '#9ca3af', label: '未开始' },
  [QuestionStatus.ATTEMPTED]: { icon: '◐', color: '#f59e0b', label: '尝试中' },
  [QuestionStatus.SOLVED]: { icon: '●', color: '#22c55e', label: '已完成' },
};

// 分类图标
const CategoryIcon: Record<CategoryTag, string> = {
  [CategoryTag.JS_ANALYSIS]: '🔍',
  [CategoryTag.JS_HANDWRITE]: '✍️',
  [CategoryTag.TS_TYPES]: '📘',
  [CategoryTag.REACT]: '⚛️',
  [CategoryTag.HTML_CSS]: '🎨',
  [CategoryTag.ALGORITHM]: '🧮',
};

// localStorage key
const QUESTION_STATUS_KEY = 'question-status-map';

// 获取所有题目状态
export function getQuestionStatusMap(): Record<string, QuestionStatus> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(QUESTION_STATUS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

// 设置单个题目状态
export function setQuestionStatus(questionId: string, status: QuestionStatus) {
  if (typeof window === 'undefined') return;
  const map = getQuestionStatusMap();
  map[questionId] = status;
  localStorage.setItem(QUESTION_STATUS_KEY, JSON.stringify(map));
}

interface QuestionSidebarProps {
  questions: Question[];
  questionsByCategory: Map<CategoryTag, Question[]>;
  selectedQuestionId: string | null;
  expandedCategories: Set<CategoryTag>;
  onSelectQuestion: (id: string) => void;
  onToggleCategory: (tag: CategoryTag) => void;
}

const QuestionSidebar: React.FC<QuestionSidebarProps> = ({
  questions,
  questionsByCategory,
  selectedQuestionId,
  expandedCategories,
  onSelectQuestion,
  onToggleCategory,
}) => {
  const [statusMap, setStatusMap] = useState<Record<string, QuestionStatus>>({});

  // 加载状态数据
  useEffect(() => {
    setStatusMap(getQuestionStatusMap());
  }, []);

  // 监听localStorage变化（其他标签页或组件更新时）
  useEffect(() => {
    const handleStorageChange = () => {
      setStatusMap(getQuestionStatusMap());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 更新状态并刷新UI
  const updateStatus = (questionId: string, status: QuestionStatus) => {
    setQuestionStatus(questionId, status);
    setStatusMap(prev => ({ ...prev, [questionId]: status }));
  };

  // 暴露给外部的更新方法（通过ref或context，这里简化处理）
  // 当有代码保存时，外部可以调用 setQuestionStatus 来更新状态

  const getStatus = (questionId: string): QuestionStatus => {
    return statusMap[questionId] ?? QuestionStatus.NOT_DONE;
  };

  return (
    <div 
      className="w-[240px] flex-shrink-0 backdrop-blur-md border-r border-purple-200/50 flex flex-col min-h-0"
      style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0.15) 0%, rgba(167,139,250,0.1) 100%)' }}
    >
      <div className="px-4 py-3 border-b border-purple-200/50 bg-white/20 flex-shrink-0">
        <h2 className="text-sm font-semibold text-purple-700">📚 题目分类</h2>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
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
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center justify-between transition-colors ${
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
                      const isSelected = selectedQuestionId === q.id;
                      const status = getStatus(q.id);
                      const statusInfo = StatusIcon[status];
                      
                      return (
                        <Tooltip
                          key={`${tag}-${q.id}`}
                          label={q.title}
                          position="right"
                          withArrow
                          multiline
                          w={220}
                          openDelay={500}
                          disabled={q.title.length < 15}
                        >
                          <button
                            onClick={() => onSelectQuestion(q.id)}
                            className={`w-full text-left pl-10 pr-2 py-2 text-sm transition-all duration-200 flex items-center gap-1 ${
                              isSelected
                                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
                                : 'text-gray-600 hover:bg-white/50'
                            }`}
                          >
                            {/* 状态图标 */}
                            <Tooltip label={statusInfo.label} position="top" withArrow openDelay={300}>
                              <span 
                                className="flex-shrink-0 text-xs cursor-help"
                                style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : statusInfo.color }}
                              >
                                {statusInfo.icon}
                              </span>
                            </Tooltip>
                            
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
    </div>
  );
};

export default QuestionSidebar;

