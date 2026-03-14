'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { notifications } from '@mantine/notifications';
import Header from '@/components/Header';
import { useQuestionRoute } from '@/hooks/useQuestionRoute';
import { toggleFavorite, loadFavoritesFromServer } from '@/lib/favorites';
import {
  QuestionStatus,
  setQuestionStatus,
  loadQuestionStatusFromServer,
} from '@/lib/questionStatus';
import { getBaguDetail } from '@/services/questions';
import { trackPageView, trackQuestionView } from '@/lib/analytics';
import BaguSidebar from './BaguSidebar';
import QuestionDetail from './QuestionDetail';
import type { BaguListData, BaguQuestionListItem, BaguQuestionDetail as BaguQuestionDetailType } from '@/types/bagu';

interface BaguClientProps {
  initialData: BaguListData;
}

export default function BaguClient({ initialData }: BaguClientProps) {
  // 监听登录状态
  const { status: sessionStatus } = useSession();
  const prevSessionStatus = useRef(sessionStatus);

  // 数据状态 - 使用服务端传入的列表数据
  const [data] = useState<BaguListData>(initialData);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [statusMap, setStatusMap] = useState<Record<number, QuestionStatus>>({});
  const [favoriteQuestions, setFavoriteQuestions] = useState<Set<number>>(new Set());

  // 题目详情缓存
  const [detailCache, setDetailCache] = useState<Map<number, BaguQuestionDetailType>>(new Map());
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // 获取当前选中题目的详情
  const selectedDetail = selectedQuestionId ? (detailCache.get(selectedQuestionId) ?? null) : null;

  // 获取当前选中题目的列表项信息
  const selectedQuestion = useMemo(() => {
    if (!selectedQuestionId || !data) return null;
    for (const cat of data.categories) {
      const q = cat.questions.find(q => q.id === selectedQuestionId);
      if (q) return q;
    }
    return null;
  }, [data, selectedQuestionId]);

  // 计算已完成题目的 Set（用于兼容现有组件）
  const completedQuestions = useMemo(() => {
    const set = new Set<number>();
    Object.entries(statusMap).forEach(([id, status]) => {
      if (status === QuestionStatus.SOLVED) {
        set.add(Number(id));
      }
    });
    return set;
  }, [statusMap]);

  // 移动端侧边栏状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 过滤条件（可同时选中）
  const [showIncomplete, setShowIncomplete] = useState(false);
  const [showFavorited, setShowFavorited] = useState(false);

  // 获取所有题目的扁平列表（提前计算，供 hook 使用）
  const allQuestions = useMemo(() => {
    if (!data) return [];
    const result: { question: BaguQuestionListItem; categoryId: number }[] = [];
    for (const category of data.categories) {
      for (const question of category.questions) {
        result.push({ question, categoryId: category.id });
      }
    }
    return result;
  }, [data]);

  // 请求题目详情
  const fetchDetail = useCallback(async (questionId: number) => {
    // 已有缓存则跳过
    if (detailCache.has(questionId)) return;

    setIsLoadingDetail(true);
    const { ok, data: detail } = await getBaguDetail(questionId);
    if (ok && detail) {
      setDetailCache(prev => new Map(prev).set(questionId, detail));
      // 同步收藏状态
      setFavoriteQuestions(prev => {
        const next = new Set(prev);
        if (detail.isFavorited) {
          next.add(questionId);
        } else {
          next.delete(questionId);
        }
        return next;
      });
      // 追踪题目浏览
      trackQuestionView(questionId, detail.title, 'bagu');
    }
    setIsLoadingDetail(false);
  }, [detailCache]);

  // 选择题目（带自动展开分类）
  const selectQuestionWithExpand = useCallback(
    (item: { question: BaguQuestionListItem; categoryId: number }) => {
      const { question, categoryId } = item;
      setSelectedQuestionId(question.id);
      setSelectedCategoryId(categoryId);
      // 自动展开分类
      setExpandedCategories((prev) => {
        if (prev.has(categoryId)) return prev;
        return new Set([...prev, categoryId]);
      });
      // 请求详情
      fetchDetail(question.id);
    },
    [fetchDetail]
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
    getKey: (item) => String(item.question.id),
    selectedKey: selectedQuestionId ? String(selectedQuestionId) : null,
    onSelect: selectQuestionWithExpand,
    onSelectFirst: selectFirstQuestion,
    paramName: 'q',
  });

  // 加载用户数据（状态 + 收藏）
  useEffect(() => {
    // 追踪页面浏览
    trackPageView('/bagu');
    // 加载完成状态
    loadQuestionStatusFromServer('bagu').then((map) => {
      setStatusMap(map);
    });
    // 加载收藏列表
    loadFavoritesFromServer('bagu').then((ids) => {
      setFavoriteQuestions(ids);
    });
  }, []);

  // 监听登录状态变化
  useEffect(() => {
    const prev = prevSessionStatus.current;

    // 登录：重新加载用户数据
    if (prev === 'unauthenticated' && sessionStatus === 'authenticated') {
      loadQuestionStatusFromServer('bagu').then((map) => {
        setStatusMap(map);
      });
      loadFavoritesFromServer('bagu').then((ids) => {
        setFavoriteQuestions(ids);
      });
    }

    // 退登：清空用户相关数据（保留题目内容缓存）
    if (prev === 'authenticated' && sessionStatus === 'unauthenticated') {
      setStatusMap({});
      setFavoriteQuestions(new Set());
    }

    prevSessionStatus.current = sessionStatus;
  }, [sessionStatus]);

  // 切换分类展开状态
  const toggleCategory = useCallback((categoryId: number) => {
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
  const selectQuestion = useCallback((question: BaguQuestionListItem, categoryId: number) => {
    setSelectedQuestionId(question.id);
    setSelectedCategoryId(categoryId);
    // 移动端选择后收起侧边栏
    setIsSidebarOpen(false);
    // 请求详情
    fetchDetail(question.id);
  }, [fetchDetail]);

  // 标记为完成/未完成
  const toggleCompleted = useCallback(async () => {
    if (!selectedQuestionId) return;

    const currentStatus = statusMap[selectedQuestionId] ?? QuestionStatus.NOT_DONE;
    const targetStatus = currentStatus === QuestionStatus.SOLVED ? QuestionStatus.NOT_DONE : QuestionStatus.SOLVED;

    // 更新数据库（服务端优先）
    const { success, finalStatus, httpStatus } = await setQuestionStatus(selectedQuestionId, targetStatus, 'bagu', currentStatus);

    if (!success) {
      // 401 由 API 层统一弹出登录框，这里不再显示错误提示
      if (httpStatus !== 401) {
        notifications.show({ autoClose: 2000, title: '操作失败', message: '请稍后重试', color: 'red' });
      }
      return;
    }

    // 更新本地状态
    setStatusMap((prev) => ({
      ...prev,
      [selectedQuestionId]: finalStatus,
    }));

    // 显示提示
    if (finalStatus === QuestionStatus.SOLVED) {
      notifications.show({
        autoClose: 1500,
        title: '完成',
        message: '已标记为完成！',
        color: 'green',
      });
    } else {
      notifications.show({
        autoClose: 1500,
        title: '已取消',
        message: '已取消完成标记',
        color: 'gray',
      });
    }
  }, [selectedQuestionId, statusMap]);

  // 获取当前分类
  const selectedCategory = useMemo(() => {
    if (!data || !selectedCategoryId) return null;
    return data.categories.find((c) => c.id === selectedCategoryId) ?? null;
  }, [data, selectedCategoryId]);

  // 过滤后的分类数据
  const filteredCategories = useMemo(() => {
    if (!data) return [];
    // 没有任何筛选条件时，返回全部
    if (!showIncomplete && !showFavorited) return data.categories;

    const newCategories = data.categories
      .map((cat) => ({
        ...cat,
        questions: cat.questions.filter((q) => {
          // 两个条件同时选中时取交集
          const incompleteMatch = !showIncomplete || !completedQuestions.has(q.id);
          const favoritedMatch = !showFavorited || favoriteQuestions.has(q.id);
          return incompleteMatch && favoritedMatch;
        }),
      }))
      .filter((cat) => cat.questions.length > 0);
    return newCategories;
  }, [data, showIncomplete, showFavorited, completedQuestions, favoriteQuestions]);

  // 当前题目是否已完成
  const isCurrentCompleted = selectedQuestionId
    ? completedQuestions.has(selectedQuestionId)
    : false;

  // 当前题目是否已收藏
  const isCurrentFavorited = selectedQuestionId
    ? favoriteQuestions.has(selectedQuestionId)
    : false;

  // 切换收藏状态
  const handleToggleFavorite = useCallback(async () => {
    if (!selectedQuestionId) return;

    const currentStatus = favoriteQuestions.has(selectedQuestionId);
    const { success, newStatus, status } = await toggleFavorite('bagu', selectedQuestionId, currentStatus);

    if (!success) {
      // 401 由 API 层统一弹出登录框，这里不再显示错误提示
      if (status !== 401) {
        notifications.show({ autoClose: 2000, title: '操作失败', message: '请稍后重试', color: 'red' });
      }
      return;
    }

    setFavoriteQuestions((prev) => {
      const next = new Set(prev);
      if (newStatus) {
        next.add(selectedQuestionId);
      } else {
        next.delete(selectedQuestionId);
      }
      return next;
    });

    // 更新缓存中的收藏状态
    setDetailCache(prev => {
      const detail = prev.get(selectedQuestionId);
      if (detail) {
        const newMap = new Map(prev);
        newMap.set(selectedQuestionId, { ...detail, isFavorited: newStatus });
        return newMap;
      }
      return prev;
    });

    notifications.show({
      autoClose: 1500,
      title: newStatus ? '已收藏' : '已取消收藏',
      message: newStatus ? '题目已添加到收藏' : '题目已从收藏中移除',
      color: newStatus ? 'yellow' : 'gray',
    });
  }, [selectedQuestionId, favoriteQuestions]);

  // 筛选后的题目扁平列表（用于导航）
  const filteredQuestions = useMemo(() => {
    const result: { question: BaguQuestionListItem; categoryId: number }[] = [];
    for (const category of filteredCategories) {
      for (const question of category.questions) {
        result.push({ question, categoryId: category.id });
      }
    }
    return result;
  }, [filteredCategories]);

  // 当前题目在筛选列表中的索引
  const currentIndex = useMemo(() => {
    if (!selectedQuestionId) return -1;
    return filteredQuestions.findIndex((q) => q.question.id === selectedQuestionId);
  }, [filteredQuestions, selectedQuestionId]);

  // 当前题目在全部列表中的索引（用于当前题目不在筛选范围时定位）
  const currentIndexInAll = useMemo(() => {
    if (!selectedQuestionId) return -1;
    return allQuestions.findIndex((q) => q.question.id === selectedQuestionId);
  }, [allQuestions, selectedQuestionId]);

  // 当题目不在筛选范围时，找到筛选列表中最近的上/下一题索引
  const findNearestFilteredIndex = useCallback(
    (direction: 'prev' | 'next'): number => {
      if (currentIndexInAll === -1 || filteredQuestions.length === 0) return -1;

      // 创建筛选题目 ID 到筛选列表索引的映射
      const filteredIdToIndex = new Map<number, number>();
      filteredQuestions.forEach((q, idx) => {
        filteredIdToIndex.set(q.question.id, idx);
      });

      if (direction === 'prev') {
        // 从当前位置往前找第一个在筛选列表中的题目
        for (let i = currentIndexInAll - 1; i >= 0; i--) {
          const idx = filteredIdToIndex.get(allQuestions[i].question.id);
          if (idx !== undefined) return idx;
        }
      } else {
        // 从当前位置往后找第一个在筛选列表中的题目
        for (let i = currentIndexInAll + 1; i < allQuestions.length; i++) {
          const idx = filteredIdToIndex.get(allQuestions[i].question.id);
          if (idx !== undefined) return idx;
        }
      }
      return -1;
    },
    [allQuestions, filteredQuestions, currentIndexInAll]
  );

  // 是否有上一题/下一题可用（考虑当前题目不在筛选范围的情况）
  const hasPrev = useMemo(() => {
    if (filteredQuestions.length === 0) return false;
    if (currentIndex > 0) return true;
    if (currentIndex === -1) return findNearestFilteredIndex('prev') !== -1;
    return false;
  }, [filteredQuestions.length, currentIndex, findNearestFilteredIndex]);

  const hasNext = useMemo(() => {
    if (filteredQuestions.length === 0) return false;
    if (currentIndex >= 0 && currentIndex < filteredQuestions.length - 1) return true;
    if (currentIndex === -1) return findNearestFilteredIndex('next') !== -1;
    return false;
  }, [filteredQuestions.length, currentIndex, findNearestFilteredIndex]);

  // 上一题（在筛选范围内）
  const goToPrev = useCallback(() => {
    if (filteredQuestions.length === 0) return;

    let targetIndex: number;
    if (currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (currentIndex === -1) {
      // 当前题目不在筛选范围，找最近的上一题
      targetIndex = findNearestFilteredIndex('prev');
      if (targetIndex === -1) return;
    } else {
      return;
    }

    const { question, categoryId } = filteredQuestions[targetIndex];
    if (!expandedCategories.has(categoryId)) {
      toggleCategory(categoryId);
    }
    selectQuestion(question, categoryId);
  }, [filteredQuestions, currentIndex, findNearestFilteredIndex, expandedCategories, toggleCategory, selectQuestion]);

  // 下一题（在筛选范围内）
  const goToNext = useCallback(() => {
    if (filteredQuestions.length === 0) return;

    let targetIndex: number;
    if (currentIndex >= 0 && currentIndex < filteredQuestions.length - 1) {
      targetIndex = currentIndex + 1;
    } else if (currentIndex === -1) {
      // 当前题目不在筛选范围，找最近的下一题
      targetIndex = findNearestFilteredIndex('next');
      if (targetIndex === -1) return;
    } else {
      return;
    }

    const { question, categoryId } = filteredQuestions[targetIndex];
    if (!expandedCategories.has(categoryId)) {
      toggleCategory(categoryId);
    }
    selectQuestion(question, categoryId);
  }, [filteredQuestions, currentIndex, findNearestFilteredIndex, expandedCategories, toggleCategory, selectQuestion]);

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
        <BaguSidebar
          data={data}
          filteredCategories={filteredCategories}
          selectedQuestionId={selectedQuestionId}
          expandedCategories={expandedCategories}
          completedQuestions={completedQuestions}
          isSidebarOpen={isSidebarOpen}
          showIncomplete={showIncomplete}
          showFavorited={showFavorited}
          onCloseSidebar={() => setIsSidebarOpen(false)}
          onSelectQuestion={selectQuestion}
          onToggleCategory={toggleCategory}
          onToggleIncomplete={() => setShowIncomplete(prev => !prev)}
          onToggleFavorited={() => setShowFavorited(prev => !prev)}
          onGoToPrev={goToPrev}
          onGoToNext={goToNext}
        />

        {/* 右侧内容区 */}
        <QuestionDetail
          question={selectedQuestion}
          detail={selectedDetail}
          category={selectedCategory}
          isLoading={isLoadingDetail}
          isCompleted={isCurrentCompleted}
          isFavorited={isCurrentFavorited}
          isSidebarOpen={isSidebarOpen}
          currentIndex={currentIndex}
          totalCount={filteredQuestions.length}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onCloseSidebar={() => setIsSidebarOpen(false)}
          onToggleFavorite={handleToggleFavorite}
          onToggleComplete={toggleCompleted}
          onPrev={goToPrev}
          onNext={goToNext}
        />
      </div>

    </div>
  );
}
