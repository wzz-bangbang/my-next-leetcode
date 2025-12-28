'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface UseQuestionRouteOptions<T> {
  /** 所有题目列表（扁平化） */
  questions: T[];
  /** 获取题目的唯一键（用于 URL 参数匹配） */
  getKey: (item: T) => string;
  /** 当前选中的唯一键 */
  selectedKey: string | null;
  /** 选中题目的回调 */
  onSelect: (item: T) => void;
  /** 默认选中第一题的回调（当 URL 参数无效时） */
  onSelectFirst?: () => void;
  /** 查询参数名，默认 'q' */
  paramName?: string;
}

/**
 * 题目路由同步 Hook
 * - 将选中题目同步到 URL 查询参数
 * - 页面加载时从 URL 恢复选中状态
 * - 支持滚动到选中题目
 */
export function useQuestionRoute<T>({
  questions,
  getKey,
  selectedKey,
  onSelect,
  onSelectFirst,
  paramName = 'q',
}: UseQuestionRouteOptions<T>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initializedRef = useRef(false);

  // 更新 URL 查询参数
  const updateUrlParam = useCallback(
    (key: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (key) {
        params.set(paramName, key);
      } else {
        params.delete(paramName);
      }
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [searchParams, pathname, router, paramName]
  );

  // 初始化：从 URL 恢复选中状态
  useEffect(() => {
    if (initializedRef.current || questions.length === 0) return;
    initializedRef.current = true;

    const urlKey = searchParams.get(paramName);

    if (urlKey) {
      const found = questions.find((q) => getKey(q) === urlKey);
      if (found) {
        onSelect(found);
        return;
      }
    }

    // URL 参数无效或不存在，清除参数并选中第一题
    if (urlKey) {
      updateUrlParam(null);
    }
    if (onSelectFirst) {
      onSelectFirst();
    }
  }, [questions, searchParams, paramName, getKey, onSelect, onSelectFirst, updateUrlParam]);

  // 选中题目变化时，更新 URL
  useEffect(() => {
    if (!initializedRef.current) return;
    updateUrlParam(selectedKey);
  }, [selectedKey, updateUrlParam]);

  return { updateUrlParam };
}

/**
 * 滚动到选中元素（仅滚动指定容器，不影响页面）
 * @param container 滚动容器
 * @param selectedId 选中元素的 ID
 * @param selector 选中元素的选择器函数
 */
export function scrollToSelected(
  container: HTMLElement | null,
  selectedId: string | null,
  selector: (id: string) => string = (id) => `[data-question-id="${id}"]`
) {
  if (!container || !selectedId) return;

  const element = container.querySelector(selector(selectedId)) as HTMLElement;
  if (!element) return;

  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  // 计算元素相对于容器的位置
  const elementTopRelative = elementRect.top - containerRect.top + container.scrollTop;
  const elementBottomRelative = elementTopRelative + elementRect.height;

  // 检查元素是否在可视区域内
  const isAbove = elementRect.top < containerRect.top;
  const isBelow = elementRect.bottom > containerRect.bottom;

  if (isAbove || isBelow) {
    // 计算目标滚动位置，让元素居中显示
    const targetScrollTop = elementTopRelative - (containerRect.height / 2) + (elementRect.height / 2);
    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    });
  }
}

