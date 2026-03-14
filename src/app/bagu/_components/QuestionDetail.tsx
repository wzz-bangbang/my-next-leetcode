'use client';

import { Tooltip, Button, ActionIcon, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dynamic from 'next/dynamic';
import type { BaguQuestionListItem, BaguQuestionDetail as BaguQuestionDetailType, BaguCategory } from '@/types/bagu';
import {
  StarFilledIcon,
  StarIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  BookOpenIcon,
  NoteIcon,
  MenuIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@/components/icons';

const MarkdownContent = dynamic(() => import('./MarkdownContent'), {
  loading: () => (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-4 bg-gray-200 rounded w-4/5" />
      <div className="h-20 bg-gray-100 rounded mt-4" />
    </div>
  ),
  ssr: false,
});

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    notifications.show({
      autoClose: 1500,
      title: '已复制',
      message: '标题已复制到剪贴板',
      color: 'blue',
    });
  } catch {
    notifications.show({
      autoClose: 1500,
      title: '复制失败',
      message: '请手动复制',
      color: 'red',
    });
  }
}

interface QuestionDetailProps {
  question: BaguQuestionListItem | null;
  detail: BaguQuestionDetailType | null;
  category: BaguCategory | null;
  isLoading: boolean;
  isCompleted: boolean;
  isFavorited: boolean;
  isSidebarOpen: boolean;
  currentIndex: number;
  totalCount: number;
  hasPrev: boolean;
  hasNext: boolean;
  onOpenSidebar: () => void;
  onCloseSidebar: () => void;
  onToggleFavorite: () => void;
  onToggleComplete: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function QuestionDetail({
  question,
  detail,
  category,
  isLoading,
  isCompleted,
  isFavorited,
  isSidebarOpen,
  currentIndex,
  totalCount,
  hasPrev,
  hasNext,
  onOpenSidebar,
  onCloseSidebar,
  onToggleFavorite,
  onToggleComplete,
  onPrev,
  onNext,
}: QuestionDetailProps) {
  return (
    <div className={`flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative ${isSidebarOpen ? 'md:opacity-100' : ''}`}>
      {/* 移动端遮罩层 - 只覆盖内容区 */}
      {isSidebarOpen && (
        <div
          className="md:hidden absolute inset-0 bg-black/40 z-20"
          onClick={onCloseSidebar}
        />
      )}

      {/* 移动端题目选择栏 */}
      <div className="md:hidden shrink-0 px-2 py-2 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <button
          onClick={onOpenSidebar}
          className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/60 border border-purple-200/50 text-left"
        >
          <MenuIcon size={14} className="text-purple-600" />
          {question ? (
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 shrink-0">
                {category?.name}
              </span>
              <span className="text-xs font-medium text-gray-800 truncate">
                {question.title}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-500">选择题目</span>
          )}
          <ChevronDownIcon size={10} className="text-gray-400" />
        </button>
      </div>

      {question ? (
        <>
          {/* 题目标题栏 - PC端 */}
          <div className="hidden md:block shrink-0 px-6 py-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-600">
                {category?.name}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={onToggleFavorite}
                  variant="light"
                  radius="xl"
                  size="xs"
                  color={isFavorited ? 'yellow' : 'gray'}
                  leftSection={isFavorited ? <StarFilledIcon size={14} /> : <StarIcon size={14} />}
                >
                  {isFavorited ? '已收藏' : '收藏'}
                </Button>
                <Button
                  onClick={onToggleComplete}
                  variant="light"
                  radius="xl"
                  size="xs"
                  color={isCompleted ? 'green' : 'gray'}
                  leftSection={isCompleted ? <CheckIcon size={14} /> : <ClockIcon size={14} />}
                >
                  {isCompleted ? '已完成' : '标为完成'}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-800">{question.title}</h1>
              <Tooltip label="复制标题" position="top" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={() => copyToClipboard(question.title)}
                >
                  <CopyIcon size={14} />
                </ActionIcon>
              </Tooltip>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-6 pb-[60px] sm:pb-6 bg-white/30 backdrop-blur-sm flex flex-col">
            <div className="flex-1">
              {isLoading && !detail ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Loader color="violet" size="md" />
                  <p className="text-xs sm:text-sm mt-3">加载中...</p>
                </div>
              ) : detail?.content ? (
                <MarkdownContent content={detail.content} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <NoteIcon size={48} className="mb-3 sm:mb-4" />
                  <p className="text-xs sm:text-base">暂无答案，等待补充...</p>
                </div>
              )}
            </div>

            {/* PC端底部导航 */}
            <div className="hidden sm:block shrink-0 pt-6 mt-6 border-t border-gray-200/50">
              <div className="flex items-center justify-between">
                <Button
                  onClick={onPrev}
                  variant="light"
                  radius="xl"
                  size="xs"
                  color="violet"
                  disabled={!hasPrev}
                  leftSection={<ArrowLeftIcon size={12} />}
                >
                  <span className="text-xs">上一题</span>
                </Button>

                <span className="text-xs text-gray-400">
                  {currentIndex >= 0 ? currentIndex + 1 : '-'} / {totalCount}
                </span>

                <Button
                  onClick={onNext}
                  variant="light"
                  radius="xl"
                  size="xs"
                  color="violet"
                  disabled={!hasNext}
                  rightSection={<ArrowRightIcon size={12} />}
                >
                  <span className="text-xs">下一题</span>
                </Button>
              </div>
            </div>
          </div>

          {/* 移动端底部固定导航 */}
          <div className="sm:hidden absolute bottom-0 left-0 right-0 z-10 px-2 py-2.5 bg-white/95 backdrop-blur-sm border-t border-gray-200/50 flex items-center justify-between gap-1">
            <Button
              onClick={onPrev}
              variant="light"
              radius="xl"
              size="xs"
              color="violet"
              disabled={!hasPrev}
              className="px-2! shrink-0"
            >
              <ArrowLeftIcon size={12} />
            </Button>

            <Button
              onClick={onToggleFavorite}
              variant="light"
              radius="xl"
              size="xs"
              color={isFavorited ? 'yellow' : 'gray'}
              className="px-2! shrink-0"
            >
              <span className="text-[10px] whitespace-nowrap flex items-center gap-0.5">
                {isFavorited ? <StarFilledIcon size={12} /> : <StarIcon size={12} />}
                <span>{isFavorited ? '已收藏' : '收藏'}</span>
              </span>
            </Button>

            <Button
              onClick={onToggleComplete}
              variant="light"
              radius="xl"
              size="xs"
              color={isCompleted ? 'green' : 'gray'}
              className="px-2! shrink-0"
            >
              <span className="text-[10px] whitespace-nowrap flex items-center gap-0.5">
                {isCompleted ? <CheckIcon size={12} /> : <ClockIcon size={12} />}
                <span>{isCompleted ? '完成' : '待完成'}</span>
              </span>
            </Button>

            <Button
              onClick={onNext}
              variant="light"
              radius="xl"
              size="xs"
              color="violet"
              disabled={!hasNext}
              className="px-2! shrink-0"
            >
              <ArrowRightIcon size={12} />
            </Button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-4 sm:p-6">
          <BookOpenIcon size={64} className="mb-3 sm:mb-4" />
          <p className="text-sm sm:text-lg text-center">
            <span className="md:hidden">点击上方选择题目</span>
            <span className="hidden md:inline">请从左侧选择一道题目</span>
          </p>
        </div>
      )}
    </div>
  );
}
