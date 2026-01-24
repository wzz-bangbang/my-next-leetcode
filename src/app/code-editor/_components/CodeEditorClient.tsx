'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Modal, Group, Loader } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';

// 懒加载 MarkdownContent（包含大量依赖）
const MarkdownContent = dynamic(() => import('@/app/bagu/_components/MarkdownContent'), {
  loading: () => (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-4 bg-gray-200 rounded w-4/5" />
    </div>
  ),
  ssr: false,
});
import CodeEditorPanel from './CodeEditorPanel';
import ExecutionResultPanel from './ExecutionResultPanel';
import QuestionSidebar, { QuestionStatus, setQuestionStatus, getQuestionStatusMap } from './QuestionSidebar';
import { CategoryTag, Difficulty, DifficultyLabel, DifficultyColor, CategoryTagLabel, QuestionListItem, QuestionDetail } from '@/types/question';
import { useQuestionRoute, scrollToSelected } from '@/hooks/useQuestionRoute';
import { toggleFavorite } from '@/lib/favorites';

interface CodeEditorClientProps {
  initialQuestions: QuestionListItem[];
}

function CodeEditorClient({ initialQuestions }: CodeEditorClientProps) {
  const [isClient, setIsClient] = useState(false);
  const [code, setCode] = useState('');
  const [questions] = useState<QuestionListItem[]>(initialQuestions);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [selectedCategoryTag, setSelectedCategoryTag] = useState<CategoryTag | null>(null);
  const [templateModalOpened, { open: openTemplateModal, close: closeTemplateModal }] = useDisclosure(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [returnValue, setReturnValue] = useState<string>('');
  const [executionError, setExecutionError] = useState<string>('');

  // 题目详情缓存
  const [detailCache, setDetailCache] = useState<Map<number, QuestionDetail>>(new Map());
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // 获取当前选中题目的详情
  const selectedDetail = selectedQuestionId ? detailCache.get(selectedQuestionId) : null;

  // 重置执行结果
  const resetExecutionResult = useCallback(() => {
    setConsoleLogs([]);
    setReturnValue('');
    setExecutionError('');
  }, []);

  const sandboxRef = useRef<HTMLIFrameElement | null>(null);
  const [isSandboxReady, setIsSandboxReady] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // 展开的分类
  const [expandedCategories, setExpandedCategories] = useState<Set<CategoryTag>>(new Set());
  const sidebarRef = useRef<HTMLDivElement>(null);

  // 侧边栏折叠状态
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 收藏状态
  const [favoriteQuestions, setFavoriteQuestions] = useState<Set<number>>(new Set());

  // 拖拽分隔条相关状态
  const [descWidthPercent, setDescWidthPercent] = useState(40);
  const [codeHeightPercent, setCodeHeightPercent] = useState(65);
  const [isDraggingH, setIsDraggingH] = useState(false);
  const [isDraggingV, setIsDraggingV] = useState(false);
  const mainContainerRef = useRef<HTMLDivElement | null>(null);
  const codeContainerRef = useRef<HTMLDivElement | null>(null);
  const descriptionRef = useRef<HTMLDivElement | null>(null);

  // 按分类组织题目
  const questionsByCategory = useMemo(() => {
    const map = new Map<CategoryTag, QuestionListItem[]>();

    Object.values(CategoryTag).filter(v => typeof v === 'number').forEach(tag => {
      map.set(tag as CategoryTag, []);
    });

    questions.forEach(q => {
      q.tags.forEach(tag => {
        const list = map.get(tag as CategoryTag);
        if (list) {
          list.push(q);
        }
      });
    });

    return map;
  }, [questions]);

  // 获取当前选中的题目列表项
  const selectedQuestion = useMemo(() => {
    return questions.find(q => q.id === selectedQuestionId);
  }, [questions, selectedQuestionId]);

  // 侧边栏更新触发器
  const [sidebarKey, setSidebarKey] = useState(0);

  // 切换分类展开状态
  const toggleCategory = useCallback((tag: CategoryTag) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }, []);

  // 扁平化题目列表（用于 URL 路由）
  const flatQuestions = useMemo(() => {
    const result: { question: QuestionListItem; categoryTag: CategoryTag }[] = [];
    Object.values(CategoryTag).filter(v => typeof v === 'number').forEach(tag => {
      const categoryQuestions = questionsByCategory.get(tag as CategoryTag) || [];
      categoryQuestions.forEach(q => {
        result.push({ question: q, categoryTag: tag as CategoryTag });
      });
    });
    return result;
  }, [questionsByCategory]);

  // 生成 URL 键
  const getUrlKey = useCallback((item: { question: QuestionListItem; categoryTag: CategoryTag }) => {
    return `${item.categoryTag}-${item.question.slug}`;
  }, []);

  // 当前选中的 URL 键
  const selectedUrlKey = useMemo(() => {
    if (!selectedQuestionId || selectedCategoryTag === null) return null;
    const selectedQ = questions.find(q => q.id === selectedQuestionId);
    return selectedQ ? `${selectedCategoryTag}-${selectedQ.slug}` : null;
  }, [selectedQuestionId, selectedCategoryTag, questions]);

  // 请求题目详情
  const fetchDetail = useCallback(async (questionId: number) => {
    if (detailCache.has(questionId)) return;

    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/code?id=${questionId}`);
      if (res.ok) {
        const detail: QuestionDetail = await res.json();
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
      }
    } catch (error) {
      console.error('Failed to fetch detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [detailCache]);

  // URL 路由同步 - 直接选择题目
  const selectQuestionDirect = useCallback((item: { question: QuestionListItem; categoryTag: CategoryTag }) => {
    const { question, categoryTag } = item;
    setSelectedQuestionId(question.id);
    setSelectedCategoryTag(categoryTag);
    setCode('');
    resetExecutionResult();
    setExpandedCategories(prev => {
      if (prev.has(categoryTag)) return prev;
      return new Set([...prev, categoryTag]);
    });
    fetchDetail(question.id);
  }, [resetExecutionResult, fetchDetail]);

  // 选择第一题
  const selectFirstQuestion = useCallback(() => {
    if (flatQuestions.length > 0) {
      selectQuestionDirect(flatQuestions[0]);
    }
  }, [flatQuestions, selectQuestionDirect]);

  // URL 路由同步
  useQuestionRoute({
    questions: flatQuestions,
    getKey: getUrlKey,
    selectedKey: selectedUrlKey,
    onSelect: selectQuestionDirect,
    onSelectFirst: selectFirstQuestion,
    paramName: 'q',
  });

  // 切换题目时滚动侧边栏
  useEffect(() => {
    if (selectedQuestionId && selectedCategoryTag !== null) {
      setTimeout(() => {
        const selectedQ = questions.find(q => q.id === selectedQuestionId);
        if (selectedQ) {
          scrollToSelected(
            sidebarRef.current,
            `${selectedCategoryTag}-${selectedQ.id}`,
            (key) => `[data-question-key="${key}"]`
          );
        }
      }, 100);
    }
  }, [selectedQuestionId, selectedCategoryTag, questions]);

  // 切换题目时，题目描述区滚动到顶部
  useEffect(() => {
    if (selectedQuestionId && descriptionRef.current) {
      descriptionRef.current.scrollTop = 0;
    }
  }, [selectedQuestionId]);

  // 更新题目状态并刷新侧边栏
  const markQuestionAsAttempted = useCallback(async (questionId: number) => {
    const currentStatusMap = getQuestionStatusMap('code');
    const currentStatus = currentStatusMap[questionId];
    if (currentStatus === undefined || currentStatus === QuestionStatus.NOT_DONE) {
      await setQuestionStatus(questionId, QuestionStatus.ATTEMPTED, 'code');
      setSidebarKey(prev => prev + 1);
    }
  }, []);

  // Hydration fix
  useEffect(() => {
    setIsClient(true);

    const handleMessage = (event: MessageEvent) => {
      const isFromSandbox = event.source === sandboxRef.current?.contentWindow;
      const isFromSameOrigin = event.origin === window.location.origin;

      if (!isFromSandbox && !isFromSameOrigin) {
        return;
      }

      const { type, result, logs, error } = event.data;

      if (type === 'sandbox-ready') {
        setIsSandboxReady(true);
        return;
      }

      if (type === 'log') {
        setConsoleLogs(logs || []);
        return;
      }

      if (type === 'result') {
        setConsoleLogs(logs || []);
        setReturnValue(result || '');
        setExecutionError('');
        setIsExecuting(false);
        return;
      }

      if (type === 'error') {
        setConsoleLogs(logs || []);
        setReturnValue('');
        setExecutionError(error || '未知错误');
        setIsExecuting(false);
        return;
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // 切换题目时自动加载历史代码
  const loadSavedCode = useCallback(async (questionId: number, template?: string) => {
    try {
      const res = await fetch(`/api/answers?questionId=${questionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.code) {
          setCode(data.code);
        } else {
          setCode(template || '');
        }
      } else {
        setCode(template || '');
      }
    } catch (error) {
      console.error('Auto load failed:', error);
      setCode(template || '');
    }
  }, []);

  useEffect(() => {
    if (selectedQuestionId && isClient && selectedDetail) {
      resetExecutionResult();
      loadSavedCode(selectedQuestionId, selectedDetail.template);
    }
  }, [selectedQuestionId, isClient, loadSavedCode, selectedDetail, resetExecutionResult]);

  const handleSelectChange = useCallback(async (value: number | null, categoryTag?: CategoryTag) => {
    if (value && (value !== selectedQuestionId || categoryTag !== selectedCategoryTag)) {
      // 自动保存当前代码
      if (code.trim() && selectedQuestionId && selectedDetail) {
        const template = selectedDetail.template || '';
        if (code.trim() !== template.trim()) {
          try {
            const res = await fetch('/api/answers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ questionId: selectedQuestionId, code }),
            });
            if (res.ok) {
              markQuestionAsAttempted(selectedQuestionId);
            }
          } catch (error) {
            console.error('Auto save failed:', error);
          }
        }
      }

      setSelectedQuestionId(value);
      setSelectedCategoryTag(categoryTag ?? null);
      setCode('');
      resetExecutionResult();
      fetchDetail(value);
    }
  }, [code, selectedQuestionId, selectedCategoryTag, selectedDetail, markQuestionAsAttempted, resetExecutionResult, fetchDetail]);

  // 键盘上下键切换题目
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInEditor = activeElement?.closest('.cm-editor') !== null;
      const isInInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

      if (isInEditor || isInInput) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();

        if (flatQuestions.length === 0) return;

        const currentIndex = flatQuestions.findIndex(
          item => item.question.id === selectedQuestionId && item.categoryTag === selectedCategoryTag
        );

        let nextIndex: number;
        if (e.key === 'ArrowUp') {
          nextIndex = currentIndex <= 0 ? flatQuestions.length - 1 : currentIndex - 1;
        } else {
          nextIndex = currentIndex >= flatQuestions.length - 1 ? 0 : currentIndex + 1;
        }

        const nextItem = flatQuestions[nextIndex];
        if (nextItem) {
          handleSelectChange(nextItem.question.id, nextItem.categoryTag);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flatQuestions, selectedQuestionId, selectedCategoryTag, handleSelectChange]);

  const handleExecute = () => {
    if (sandboxRef.current && sandboxRef.current.contentWindow && !isExecuting) {
      setIsExecuting(true);
      resetExecutionResult();
      sandboxRef.current.contentWindow.postMessage({ code }, '*');
    }
  };

  const handleSave = async () => {
    if (!selectedQuestionId) {
      notifications.show({ autoClose: 1500, title: '操作失败', message: '请先选择一个题目', color: 'yellow' });
      return;
    }
    if (!code.trim()) {
      notifications.show({ autoClose: 1500, title: '提示', message: '代码内容不能为空', color: 'yellow' });
      return;
    }
    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: selectedQuestionId, code }),
      });
      if (res.ok) {
        markQuestionAsAttempted(selectedQuestionId);
        notifications.show({ autoClose: 1500, title: '保存成功', message: '代码已保存！', color: 'green' });
      } else {
        notifications.show({ autoClose: 1500, title: '保存失败', message: '请稍后再试', color: 'red' });
      }
    } catch (error) {
      console.error('Save failed:', error);
      notifications.show({ autoClose: 1500, title: '网络错误', message: '保存时发生错误', color: 'red' });
    }
  };

  const handleLoadTemplate = () => {
    if (!selectedQuestionId) {
      notifications.show({ autoClose: 1500, title: '提示', message: '请先选择一个题目', color: 'blue' });
      return;
    }
    const template = selectedDetail?.template || '';
    if (!code.trim() || code.trim() === template.trim()) {
      setCode(template);
      resetExecutionResult();
      if (template) {
        notifications.show({ autoClose: 1500, title: '已载入', message: '模板代码已载入', color: 'cyan' });
      } else {
        notifications.show({ autoClose: 1500, title: '已清空', message: '本题无模板，代码区已清空', color: 'blue' });
      }
      return;
    }
    openTemplateModal();
  };

  const handleLoadTemplateWithSave = async () => {
    if (!selectedQuestionId) {
      closeTemplateModal();
      return;
    }
    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: selectedQuestionId, code }),
      });
      if (res.ok) {
        markQuestionAsAttempted(selectedQuestionId);
        notifications.show({ autoClose: 1500, title: '保存成功', message: '代码已保存', color: 'green' });
      }
    } catch (error) {
      console.error('Save failed:', error);
    }
    const template = selectedDetail?.template || '';
    setCode(template);
    resetExecutionResult();
    closeTemplateModal();
  };

  const handleLoadTemplateWithoutSave = () => {
    const template = selectedDetail?.template || '';
    setCode(template);
    resetExecutionResult();
    closeTemplateModal();
    if (template) {
      notifications.show({ autoClose: 1500, title: '已载入', message: '模板代码已载入', color: 'cyan' });
    } else {
      notifications.show({ autoClose: 1500, title: '已清空', message: '本题无模板，代码区已清空', color: 'blue' });
    }
  };

  const handleMarkAsSolved = async () => {
    if (!selectedQuestionId) {
      notifications.show({ autoClose: 1500, title: '提示', message: '请先选择一个题目', color: 'yellow' });
      return;
    }
    const statusMap = getQuestionStatusMap('code');
    const currentStatus = statusMap[selectedQuestionId];
    const newStatus = currentStatus === QuestionStatus.SOLVED ? QuestionStatus.NOT_DONE : QuestionStatus.SOLVED;

    await setQuestionStatus(selectedQuestionId, newStatus, 'code');
    setSidebarKey(prev => prev + 1);

    if (newStatus === QuestionStatus.SOLVED) {
      notifications.show({ autoClose: 1500, title: '🎉 恭喜', message: '已标记为完成！', color: 'green' });
    } else {
      notifications.show({ autoClose: 1500, title: '已取消', message: '已取消完成状态', color: 'gray' });
    }
  };

  const isCurrentSolved = useMemo(() => {
    if (!selectedQuestionId) return false;
    const statusMap = getQuestionStatusMap('code');
    return statusMap[selectedQuestionId] === QuestionStatus.SOLVED;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuestionId, sidebarKey]);

  const isCurrentFavorited = selectedQuestionId
    ? favoriteQuestions.has(selectedQuestionId)
    : false;

  const handleToggleFavorite = useCallback(() => {
    if (!selectedQuestionId) {
      notifications.show({ autoClose: 1500, title: '提示', message: '请先选择一个题目', color: 'yellow' });
      return;
    }

    const newStatus = toggleFavorite('code', selectedQuestionId);

    setFavoriteQuestions((prev) => {
      const next = new Set(prev);
      if (newStatus) {
        next.add(selectedQuestionId);
      } else {
        next.delete(selectedQuestionId);
      }
      return next;
    });

    // 更新缓存
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
      title: newStatus ? '⭐ 已收藏' : '已取消收藏',
      message: newStatus ? '题目已添加到收藏' : '题目已从收藏中移除',
      color: newStatus ? 'yellow' : 'gray',
    });
  }, [selectedQuestionId]);

  const onCodeChange = useCallback((value: string) => {
    setCode(value);
  }, []);

  // 水平拖拽处理
  const handleMouseDownH = useCallback(() => {
    setIsDraggingH(true);
  }, []);

  const handleMouseMoveH = useCallback((e: MouseEvent) => {
    if (!isDraggingH || !mainContainerRef.current) return;

    const container = mainContainerRef.current;
    const rect = container.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const containerWidth = rect.width;

    let percent = (offsetX / containerWidth) * 100;
    const minPercent = Math.max(20, (300 / containerWidth) * 100);
    percent = Math.max(minPercent, Math.min(60, percent));

    setDescWidthPercent(percent);
  }, [isDraggingH]);

  // 垂直拖拽处理
  const handleMouseDownV = useCallback(() => {
    setIsDraggingV(true);
  }, []);

  const handleMouseMoveV = useCallback((e: MouseEvent) => {
    if (!isDraggingV || !codeContainerRef.current) return;

    const container = codeContainerRef.current;
    const rect = container.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const containerHeight = rect.height;

    let percent = (offsetY / containerHeight) * 100;
    percent = Math.max(50, Math.min(80, percent));

    setCodeHeightPercent(percent);
  }, [isDraggingV]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingH(false);
    setIsDraggingV(false);
  }, []);

  // 监听全局鼠标事件
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (isDraggingH) handleMouseMoveH(e);
      if (isDraggingV) handleMouseMoveV(e);
    };

    if (isDraggingH || isDraggingV) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isDraggingH ? 'ew-resize' : 'ns-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDraggingH, isDraggingV, handleMouseMoveH, handleMouseMoveV, handleMouseUp]);

  if (!isClient) {
    return null;
  }

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
        style={{ background: 'radial-gradient(circle, rgba(255,182,193,0.6) 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-[30%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(135,206,250,0.6) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-10%] left-[30%] w-[450px] h-[450px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(152,251,152,0.5) 0%, transparent 70%)' }}
      />

      <Header />

      {/* 移动端提示 */}
      <div className="md:hidden flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10">
        <div className="text-6xl mb-6">💻</div>
        <h2 className="text-xl font-bold text-gray-800 mb-3">请使用电脑访问</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          代码编辑器需要较大屏幕才能正常使用，请在电脑端打开本页面
        </p>
        <a
          href="/bagu"
          className="mt-6 px-6 py-2.5 rounded-full text-sm font-medium text-white shadow-md"
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          }}
        >
          📚 去看八股文
        </a>
      </div>

      {/* 载入模板确认弹窗 */}
      {isClient && (
        <Modal opened={templateModalOpened} onClose={closeTemplateModal} title="载入模板" centered>
          <p>是否保存当前代码后再载入模板？</p>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeTemplateModal}>取消</Button>
            <Button color="orange" onClick={handleLoadTemplateWithoutSave}>不保存</Button>
            <Button color="violet" onClick={handleLoadTemplateWithSave}>保存后载入</Button>
          </Group>
        </Modal>
      )}

      {/* 主内容区域 - PC端显示 */}
      <div className="relative z-10 hidden md:flex min-h-0 flex-1 overflow-hidden">
        {/* 左侧分类菜单 */}
        <QuestionSidebar
          ref={sidebarRef}
          key={sidebarKey}
          questions={questions}
          questionsByCategory={questionsByCategory}
          selectedQuestionId={selectedQuestionId}
          selectedCategoryTag={selectedCategoryTag}
          expandedCategories={expandedCategories}
          onSelectQuestion={handleSelectChange}
          onToggleCategory={toggleCategory}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        />

        {/* 右侧主区域 */}
        <div ref={mainContainerRef} className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
          {/* 左侧：题目描述区 */}
          <div
            className="flex flex-col min-h-0 bg-white/50 backdrop-blur-sm"
            style={{ width: `${descWidthPercent}%`, minWidth: '300px' }}
          >
            {/* 题目标题 */}
            <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200/50 bg-white/30">
              {selectedQuestion ? (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedQuestion.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm px-2.5 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: `${DifficultyColor[selectedQuestion.difficulty as Difficulty]}20`,
                        color: DifficultyColor[selectedQuestion.difficulty as Difficulty]
                      }}
                    >
                      {DifficultyLabel[selectedQuestion.difficulty as Difficulty]}
                    </span>
                    {selectedQuestion.tags.map(tag => (
                      <span key={tag} className="text-sm px-2.5 py-1 rounded-full bg-purple-100 text-purple-600">
                        {CategoryTagLabel[tag as CategoryTag]}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-base">请从左侧选择一道题目</p>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex-shrink-0 px-5 py-3 border-b border-gray-200/50 bg-white/20">
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} variant="light" radius="xl" size="sm" color="violet">
                  💾 保存
                </Button>
                <Button
                  onClick={handleLoadTemplate}
                  variant="light"
                  radius="xl"
                  size="sm"
                  color="cyan"
                >
                  📋 模板
                </Button>
                <Button
                  onClick={handleMarkAsSolved}
                  variant="light"
                  radius="xl"
                  size="sm"
                  color={isCurrentSolved ? 'green' : 'gray'}
                >
                  {isCurrentSolved ? '✅ 已完成' : '⏳ 标为完成'}
                </Button>
                <Button onClick={handleToggleFavorite} variant="light" radius="xl" size="sm" color={isCurrentFavorited ? 'yellow' : 'gray'}>
                  {isCurrentFavorited ? '⭐ 已收藏' : '☆ 收藏'}
                </Button>
              </div>
            </div>

            {/* 题目描述及扩展信息 */}
            <div ref={descriptionRef} className="flex-1 min-h-0 overflow-y-auto p-5">
              {selectedQuestion ? (
                isLoadingDetail && !selectedDetail ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Loader color="violet" size="md" />
                    <p className="text-sm mt-3">加载中...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* 题目描述 */}
                    {selectedDetail?.description && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">📝 题目描述</h4>
                        <pre className="whitespace-pre-wrap font-sans text-gray-600 text-base leading-relaxed">{selectedDetail.description}</pre>
                      </div>
                    )}

                    {/* 建议用例 */}
                    {selectedDetail?.testCases && selectedDetail.testCases.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">🧪 建议用例</h4>
                        <div className="space-y-3">
                          {selectedDetail.testCases.map((testCase, index) => (
                            <div key={index} className="bg-gray-50/80 rounded-lg p-3 border border-gray-200/50">
                              {testCase.description && (
                                <div className="text-sm text-purple-600 font-medium mb-2">{testCase.description}</div>
                              )}
                              <div className="space-y-1.5">
                                <div className="flex items-start gap-2">
                                  <span className="text-xs text-gray-400 font-mono w-12 shrink-0">输入:</span>
                                  <pre className="text-sm text-gray-700 font-mono whitespace-pre-wrap flex-1">{testCase.input}</pre>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-xs text-gray-400 font-mono w-12 shrink-0">预期:</span>
                                  <pre className="text-sm text-green-600 font-mono whitespace-pre-wrap flex-1">{testCase.expected}</pre>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 思路解析 */}
                    {selectedDetail?.solution && (
                      <div>
                        <details className="group">
                          <summary className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider cursor-pointer list-none flex items-center gap-2 select-none">
                            <span className="transition-transform group-open:rotate-90">▶</span>
                            💡 思路解析
                            <span className="text-xs font-normal text-gray-400 normal-case">(点击展开)</span>
                          </summary>
                          <div className="mt-3 bg-white/80 rounded-lg p-4 border border-gray-200/50 solution-markdown">
                            <MarkdownContent content={selectedDetail.solution} />
                          </div>
                        </details>
                      </div>
                    )}

                    {/* 进阶思考题 */}
                    {selectedDetail?.followUp && selectedDetail.followUp.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">🚀 进阶思考</h4>
                        <ul className="space-y-2">
                          {selectedDetail.followUp.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-orange-500 font-bold shrink-0">{index + 1}.</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="text-gray-400 text-base">
                  <p>请从左侧选择一道题目</p>
                </div>
              )}
            </div>
          </div>

          {/* 水平分隔条 */}
          <div
            className={`w-1 flex-shrink-0 cursor-ew-resize transition-colors duration-150 ${
              isDraggingH ? 'bg-purple-400' : 'bg-gradient-to-b from-pink-200 via-purple-200 to-blue-200 hover:from-pink-400 hover:via-purple-400 hover:to-blue-400'
            }`}
            onMouseDown={handleMouseDownH}
          />

          {/* 右侧：代码和结果区 */}
          <div ref={codeContainerRef} className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            {/* 代码编辑器 */}
            <div style={{ height: `${codeHeightPercent}%`, minHeight: 0 }}>
              <CodeEditorPanel
                code={code}
                onChange={onCodeChange}
                height="100%"
              />
            </div>

            {/* 隐藏的 sandbox iframe */}
            <iframe
              ref={sandboxRef}
              src="/sandbox.html"
              style={{ display: 'none' }}
              sandbox="allow-scripts"
            />

            {/* 垂直分隔条 */}
            <div
              className={`h-1 flex-shrink-0 cursor-ns-resize transition-colors duration-150 ${
                isDraggingV ? 'bg-purple-400' : 'bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 hover:from-pink-400 hover:via-purple-400 hover:to-blue-400'
              }`}
              onMouseDown={handleMouseDownV}
            />

            {/* 输出区域 */}
            <div className="flex-1 min-h-0">
              <ExecutionResultPanel
                consoleLogs={consoleLogs}
                returnValue={returnValue}
                error={executionError}
                onExecute={handleExecute}
                isReady={isSandboxReady}
                isExecuting={isExecuting}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeEditorClient;
