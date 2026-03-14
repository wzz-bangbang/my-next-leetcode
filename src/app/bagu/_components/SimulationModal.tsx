'use client';

import { useState, useCallback } from 'react';
import { Modal, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { BaguListData, BaguQuestionListItem, BaguCategory } from '@/types/bagu';
import { DiceIcon } from '@/components/icons';

interface SimulationGroup {
  category: string;
  questions: BaguQuestionListItem[];
}

interface SimulationModalProps {
  data: BaguListData | null;
  filteredCategories: BaguCategory[];
  showIncomplete: boolean;
  showFavorited: boolean;
  onSelectQuestion: (question: BaguQuestionListItem, categoryId: number) => void;
  onExpandCategory: (categoryId: number) => void;
  expandedCategories: Set<number>;
}

export default function SimulationModal({
  data,
  filteredCategories,
  showIncomplete,
  showFavorited,
  onSelectQuestion,
  onExpandCategory,
  expandedCategories,
}: SimulationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [simulationQuestions, setSimulationQuestions] = useState<SimulationGroup[]>([]);

  // 生成随机模拟题
  const generateSimulation = useCallback(() => {
    if (!data) return;

    // 使用过滤后的分类数据（基于未完成/已收藏过滤）
    const categories = filteredCategories.filter((c) => c.questions.length > 0);
    
    if (categories.length === 0) {
      let message = '没有可用题目';
      if (showIncomplete && showFavorited) {
        message = '没有符合条件的题目（未完成+已收藏）';
      } else if (showIncomplete) {
        message = '没有未完成的题目';
      } else if (showFavorited) {
        message = '没有已收藏的题目';
      }
      notifications.show({
        autoClose: 2000,
        title: '无可用题目',
        message,
        color: 'orange',
      });
      return;
    }
    
    // 目标：3-6 个分类，12-18 题（根据可用数量调整）
    const maxCategories = Math.min(6, categories.length);
    const targetCategoryCount = Math.floor(Math.random() * Math.max(1, maxCategories - 2)) + Math.min(3, maxCategories);
    
    const totalAvailable = categories.reduce((sum, c) => sum + c.questions.length, 0);
    const targetTotal = Math.min(Math.floor(Math.random() * 7) + 12, totalAvailable); // 12-18，但不超过可用数量

    // 找到 React 分类（必选）
    const reactCategory = categories.find(
      (c) => c.name.toLowerCase().includes('react')
    );

    // 其他可选分类（排除 React）
    const otherCategories = categories.filter(
      (c) => !c.name.toLowerCase().includes('react')
    );

    // 随机打乱其他分类
    const shuffledOthers = [...otherCategories].sort(() => Math.random() - 0.5);

    // 选择分类：React + 其他随机分类
    const selectedCategories: BaguCategory[] = [];
    if (reactCategory) {
      selectedCategories.push(reactCategory);
    }

    // 补充其他分类直到达到目标数量
    const remainingCount = targetCategoryCount - selectedCategories.length;
    for (let i = 0; i < remainingCount && i < shuffledOthers.length; i++) {
      selectedCategories.push(shuffledOthers[i]);
    }

    // 计算每个分类平均应该抽多少题
    const avgPerCategory = Math.ceil(targetTotal / selectedCategories.length);
    
    // 从每个分类中随机抽题
    const result: SimulationGroup[] = [];
    let totalQuestions = 0;

    for (let i = 0; i < selectedCategories.length; i++) {
      const category = selectedCategories[i];
      const isLast = i === selectedCategories.length - 1;
      
      // 计算这个分类应该抽多少题
      let count: number;
      if (isLast) {
        // 最后一个分类补齐剩余数量
        count = Math.min(targetTotal - totalQuestions, category.questions.length);
      } else {
        // 随机抽 2-4 题，但不超过剩余需要的题数
        const remaining = targetTotal - totalQuestions;
        const maxForThis = Math.min(avgPerCategory + 1, category.questions.length, remaining - (selectedCategories.length - i - 1));
        const minForThis = Math.min(2, category.questions.length, remaining);
        count = Math.max(minForThis, Math.floor(Math.random() * (maxForThis - minForThis + 1)) + minForThis);
      }

      if (count <= 0) continue;

      // 随机选题
      const shuffledQuestions = [...category.questions].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffledQuestions.slice(0, count);

      result.push({
        category: category.name,
        questions: selectedQuestions,
      });
      totalQuestions += selectedQuestions.length;

      // 达到目标就停止
      if (totalQuestions >= targetTotal) break;
    }

    setSimulationQuestions(result);
    setIsOpen(true);
  }, [data, filteredCategories, showIncomplete, showFavorited]);

  // 复制题目列表
  const copyQuestionList = useCallback(async () => {
    const lines = simulationQuestions.flatMap((group) =>
      group.questions.map((q) => q.title)
    );
    const text = lines.join('\n');

    try {
      await navigator.clipboard.writeText(text);
      notifications.show({
        autoClose: 1500,
        title: '已复制',
        message: `已复制 ${lines.length} 道题目到剪贴板`,
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
  }, [simulationQuestions]);

  // 点击题目跳转
  const handleSelectQuestion = useCallback(
    (question: BaguQuestionListItem) => {
      // 找到题目所属的分类
      const category = data?.categories.find((c) =>
        c.questions.some((cq) => cq.id === question.id)
      );
      if (category) {
        onSelectQuestion(question, category.id);
        if (!expandedCategories.has(category.id)) {
          onExpandCategory(category.id);
        }
      }
      setIsOpen(false);
    },
    [data, onSelectQuestion, onExpandCategory, expandedCategories]
  );

  const totalCount = simulationQuestions.reduce((sum, c) => sum + c.questions.length, 0);

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={generateSimulation}
        className="mt-2 w-full py-1.5 md:py-2 rounded-lg bg-gradient-to-r from-pink-400 to-rose-400 text-white text-[10px] md:text-xs font-medium shadow-sm hover:shadow-md hover:from-pink-500 hover:to-rose-500 transition-all flex items-center justify-center gap-1"
      >
        <DiceIcon size={14} />
        <span>随机模拟</span>
      </button>

      {/* 弹窗 */}
      <Modal
        opened={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <DiceIcon size={20} className="text-pink-500" />
            <span className="font-semibold text-gray-800">随机模拟面试题</span>
            <span className="text-xs text-gray-400 font-normal">
              ({totalCount} 题)
            </span>
          </div>
        }
        size="lg"
        radius="lg"
        centered
        styles={{
          content: {
            background:
              'linear-gradient(135deg, rgba(255,240,245,0.95) 0%, rgba(240,248,255,0.95) 100%)',
          },
        }}
      >
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {simulationQuestions.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h3 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                {group.category}
                <span className="text-xs text-gray-400 font-normal">
                  ({group.questions.length})
                </span>
              </h3>
              <div className="space-y-1.5 pl-3">
                {group.questions.map((q, qIndex) => (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuestion(q)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-white/70 hover:bg-white hover:shadow-sm transition-all text-sm text-gray-700 hover:text-pink-600 flex items-center gap-2"
                  >
                    <span className="text-xs text-gray-400 w-5">{qIndex + 1}.</span>
                    <span className="flex-1 truncate">{q.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              onClick={generateSimulation}
              variant="gradient"
              gradient={{ from: 'pink', to: 'yellow' }}
              radius="xl"
              size="xs"
            >
              重新生成
            </Button>
            <Button
              onClick={copyQuestionList}
              variant="gradient"
              gradient={{ from: 'pink', to: 'red' }}
              radius="xl"
              size="xs"
            >
              复制
            </Button>
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            variant="light"
            color="gray"
            radius="xl"
            size="xs"
          >
            关闭
          </Button>
        </div>
      </Modal>
    </>
  );
}
