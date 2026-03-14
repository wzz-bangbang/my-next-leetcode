'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Modal, Group, Loader } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import {
  SaveIcon,
  CheckIcon,
  ClockIcon,
  StarFilledIcon,
  StarIcon,
  NoteIcon,
  TestIcon,
  OpenQuestionsIcon,
  RocketIcon,
  TrashIcon,
  TemplateIcon,
  ComputerIcon,
  BookOpenIcon,
  ChevronRightIcon,
} from '@/components/icons';

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
import QuestionSidebar, { QuestionStatus, setQuestionStatus } from './QuestionSidebar';
import { loadQuestionStatusFromServer } from '@/lib/questionStatus';
import { CategoryTag, Difficulty, DifficultyLabel, DifficultyColor, CategoryTagLabel, QuestionListItem, QuestionDetail } from '@/types/question';
import { useQuestionRoute, scrollToSelected } from '@/hooks/useQuestionRoute';
import { toggleFavorite, loadFavoritesFromServer } from '@/lib/favorites';
import { validateCode, CODE_MAX_LINES, CODE_MAX_CHARS } from '@/lib/validation';
import { getCodeQuestionDetail } from '@/services/questions';
import { saveAnswer } from '@/services/answers';
import { trackPageView, trackQuestionView } from '@/lib/analytics';

interface CodeEditorClientProps {
  initialQuestions: QuestionListItem[];
}

function CodeEditorClient({ initialQuestions }: CodeEditorClientProps) {
  // 监听登录状态
  const { status: sessionStatus } = useSession();
  const prevSessionStatus = useRef(sessionStatus);

  const [isClient, setIsClient] = useState(false);
  const [code, setCode] = useState('');
  const [questions] = useState<QuestionListItem[]>(initialQuestions);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [selectedCategoryTag, setSelectedCategoryTag] = useState<CategoryTag | null>(null);

  // 题目状态
  const [statusMap, setStatusMap] = useState<Record<number, QuestionStatus>>({});
  const [templateModalOpened, { open: openTemplateModal, close: closeTemplateModal }] = useDisclosure(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [returnValue, setReturnValue] = useState<string>('');
  const [executionError, setExecutionError] = useState<string>('');

  // 当前题目详情
  const [selectedDetail, setSelectedDetail] = useState<QuestionDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // 重置执行结果
  const resetExecutionResult = useCallback(() => {
    setConsoleLogs([]);
    setReturnValue('');
    setExecutionError('');
  }, []);

  const sandboxRef = useRef<HTMLIFrameElement | null>(null);
  const [isSandboxReady, setIsSandboxReady] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const executionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 执行超时时间（毫秒）
  const EXECUTION_TIMEOUT = 5000;

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

  // 请求题目详情（每次都从后端获取，保证数据一致性）
  const fetchDetail = useCallback(async (questionId: number) => {
    setIsLoadingDetail(true);
    setSelectedDetail(null); // 清空旧数据
    const { ok, data: detail } = await getCodeQuestionDetail(questionId);
    if (ok && detail) {
        setSelectedDetail(detail);
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
        trackQuestionView(questionId, detail.title, 'code');
      }
      setIsLoadingDetail(false);
  }, []);

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

  // 更新题目状态
  const markQuestionAsAttempted = useCallback(async (questionId: number) => {
    const currentStatus = statusMap[questionId];
    if (currentStatus === undefined || currentStatus === QuestionStatus.NOT_DONE) {
      const { success } = await setQuestionStatus(questionId, QuestionStatus.ATTEMPTED, 'code', currentStatus ?? QuestionStatus.NOT_DONE);
      if (success) {
        setStatusMap(prev => ({ ...prev, [questionId]: QuestionStatus.ATTEMPTED }));
      }
    }
  }, [statusMap]);

  // Hydration fix
  useEffect(() => {
    setIsClient(true);
    // 追踪页面浏览
    trackPageView('/code-editor');

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
        // 清除超时计时器
        if (executionTimeoutRef.current) {
          clearTimeout(executionTimeoutRef.current);
          executionTimeoutRef.current = null;
        }
        setConsoleLogs(logs || []);
        setReturnValue(result || '');
        setExecutionError('');
        setIsExecuting(false);
        return;
      }

      if (type === 'error') {
        // 清除超时计时器
        if (executionTimeoutRef.current) {
          clearTimeout(executionTimeoutRef.current);
          executionTimeoutRef.current = null;
        }
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
      // 清理超时计时器
      if (executionTimeoutRef.current) {
        clearTimeout(executionTimeoutRef.current);
      }
    };
  }, []);

  // 加载题目状态 + 收藏
  useEffect(() => {
    loadQuestionStatusFromServer('code').then((map) => {
      setStatusMap(map);
    });
    loadFavoritesFromServer('code').then((ids) => {
      setFavoriteQuestions(ids);
    });
  }, []);

  // 监听登录状态变化
  useEffect(() => {
    const prev = prevSessionStatus.current;

    // 登录：重新加载用户数据
    if (prev === 'unauthenticated' && sessionStatus === 'authenticated') {
      loadQuestionStatusFromServer('code').then((map) => {
        setStatusMap(map);
      });
      loadFavoritesFromServer('code').then((ids) => {
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

  // 切换题目时加载代码（优先使用 API 返回的 savedCode，否则用模板）
  useEffect(() => {
    if (selectedQuestionId && isClient && selectedDetail) {
      resetExecutionResult();
      // 优先使用用户保存的代码，否则使用模板
      const initialCode = selectedDetail.savedCode || selectedDetail.template || '';
      setCode(initialCode);
    }
  }, [selectedQuestionId, isClient, selectedDetail, resetExecutionResult]);

  const handleSelectChange = useCallback(async (value: number | null, categoryTag?: CategoryTag) => {
    if (value && (value !== selectedQuestionId || categoryTag !== selectedCategoryTag)) {
      // 自动保存当前代码（需登录且通过长度校验）
      if (sessionStatus === 'authenticated' && code.trim() && selectedQuestionId && selectedDetail) {
        const template = selectedDetail.template || '';
        const codeValidation = validateCode(code);
        if (code.trim() !== template.trim() && codeValidation.valid) {
          const { ok } = await saveAnswer(selectedQuestionId, code);
          if (ok) {
              markQuestionAsAttempted(selectedQuestionId);
          }
        }
      }

      setSelectedQuestionId(value);
      setSelectedCategoryTag(categoryTag ?? null);
      setCode('');
      resetExecutionResult();
      fetchDetail(value);
    }
  }, [sessionStatus, code, selectedQuestionId, selectedCategoryTag, selectedDetail, markQuestionAsAttempted, resetExecutionResult, fetchDetail]);

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
      
      // 清除之前的超时计时器
      if (executionTimeoutRef.current) {
        clearTimeout(executionTimeoutRef.current);
      }
      
      // 设置执行超时
      executionTimeoutRef.current = setTimeout(() => {
        // 超时处理：重新加载 sandbox iframe 以终止死循环
        if (sandboxRef.current) {
          const baseUrl = sandboxRef.current.src.split('?')[0];
          sandboxRef.current.src = `${baseUrl}?t=${Date.now()}`;
        }
        setExecutionError(`⏱️ 执行超时（${EXECUTION_TIMEOUT / 1000}秒）\n可能存在死循环，请检查代码。`);
        setIsExecuting(false);
        executionTimeoutRef.current = null;
      }, EXECUTION_TIMEOUT);
      
      sandboxRef.current.contentWindow.postMessage({ code }, '*');
    }
  };

  const handleSave = useCallback(async () => {
    if (!selectedQuestionId) {
      notifications.show({ autoClose: 1500, title: '操作失败', message: '请先选择一个题目', color: 'yellow' });
      return;
    }
    if (!code.trim()) {
      notifications.show({ autoClose: 1500, title: '提示', message: '代码内容不能为空', color: 'yellow' });
      return;
    }
    // 校验代码长度
    const codeValidation = validateCode(code);
    if (!codeValidation.valid) {
      notifications.show({ autoClose: 3000, title: '代码过长', message: codeValidation.message, color: 'red' });
      return;
    }
    const { ok, status } = await saveAnswer(selectedQuestionId, code);
    if (ok) {
        markQuestionAsAttempted(selectedQuestionId);
        notifications.show({ autoClose: 1500, title: '保存成功', message: '代码已保存！', color: 'green' });
    } else if (status !== 401) {
      // 401 已由 api 统一处理弹出登录框
        notifications.show({ autoClose: 1500, title: '保存失败', message: '请稍后再试', color: 'red' });
    }
  }, [selectedQuestionId, code, markQuestionAsAttempted]);

  // Ctrl+S / Cmd+S 保存代码
  useEffect(() => {
    const handleSaveShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleSaveShortcut);
    return () => window.removeEventListener('keydown', handleSaveShortcut);
  }, [handleSave]);

  // 页面关闭/隐藏时自动保存（静默保存，不显示通知）
  useEffect(() => {
    const silentSave = () => {
      if (sessionStatus !== 'authenticated') return;
      if (!selectedQuestionId || !code.trim()) return;
      
      const template = selectedDetail?.template || '';
      const codeValidation = validateCode(code);
      if (code.trim() === template.trim() || !codeValidation.valid) return;

      // 使用 sendBeacon 确保页面关闭时请求能发出
      const data = JSON.stringify({ questionId: selectedQuestionId, code });
      navigator.sendBeacon('/api/answers', data);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        silentSave();
      }
    };

    const handleBeforeUnload = () => {
      silentSave();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionStatus, selectedQuestionId, code, selectedDetail]);

  // 直接保存当前代码并载入模板（无弹窗确认）
  const handleLoadTemplate = async () => {
    if (!selectedQuestionId) {
      notifications.show({ autoClose: 1500, title: '提示', message: '请先选择一个题目', color: 'blue' });
      return;
    }
    const template = selectedDetail?.template || '';
    
    // 如果代码有修改且用户已登录，先保存
    if (sessionStatus === 'authenticated' && code.trim() && code.trim() !== template.trim()) {
      const codeValidation = validateCode(code);
      if (codeValidation.valid) {
        await saveAnswer(selectedQuestionId, code);
        markQuestionAsAttempted(selectedQuestionId);
      }
    }
    
    // 载入模板
    setCode(template);
    resetExecutionResult();
    if (template) {
      notifications.show({ autoClose: 1500, title: '已载入', message: '模板代码已载入', color: 'cyan' });
    } else {
      notifications.show({ autoClose: 1500, title: '已清空', message: '本题无模板，代码区已清空', color: 'blue' });
    }
  };

  /* [暂时注释] 原有弹窗确认逻辑
  const handleLoadTemplateOld = () => {
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
  */

  /* [暂时注释] 弹窗相关的保存/不保存处理函数
  const handleLoadTemplateWithSave = async () => {
    if (!selectedQuestionId) {
      closeTemplateModal();
      return;
    }
    const { ok } = await saveAnswer(selectedQuestionId, code);
    if (ok) {
        markQuestionAsAttempted(selectedQuestionId);
        notifications.show({ autoClose: 1500, title: '保存成功', message: '代码已保存', color: 'green' });
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
  */

  const handleMarkAsSolved = async () => {
    if (!selectedQuestionId) {
      notifications.show({ autoClose: 1500, title: '提示', message: '请先选择一个题目', color: 'yellow' });
      return;
    }
    const currentStatus = statusMap[selectedQuestionId] ?? QuestionStatus.NOT_DONE;
    const targetStatus = currentStatus === QuestionStatus.SOLVED ? QuestionStatus.NOT_DONE : QuestionStatus.SOLVED;

    const { success, finalStatus, httpStatus } = await setQuestionStatus(selectedQuestionId, targetStatus, 'code', currentStatus);

    if (!success) {
      if (httpStatus !== 401) {
        notifications.show({ autoClose: 2000, title: '操作失败', message: '请稍后重试', color: 'red' });
      }
      return;
    }

    // 更新本地状态
    setStatusMap(prev => ({ ...prev, [selectedQuestionId]: finalStatus }));

    if (finalStatus === QuestionStatus.SOLVED) {
      notifications.show({ autoClose: 1500, title: '恭喜', message: '已标记为完成！', color: 'green' });
    } else {
      notifications.show({ autoClose: 1500, title: '已取消', message: '已取消完成状态', color: 'gray' });
    }
  };

  const isCurrentSolved = useMemo(() => {
    if (!selectedQuestionId) return false;
    return statusMap[selectedQuestionId] === QuestionStatus.SOLVED;
  }, [selectedQuestionId, statusMap]);

  const isCurrentFavorited = selectedQuestionId
    ? favoriteQuestions.has(selectedQuestionId)
    : false;

  const handleToggleFavorite = useCallback(async () => {
    if (!selectedQuestionId) {
      notifications.show({ autoClose: 1500, title: '提示', message: '请先选择一个题目', color: 'yellow' });
      return;
    }

    const currentStatus = favoriteQuestions.has(selectedQuestionId);
    const { success, newStatus, status } = await toggleFavorite('code', selectedQuestionId, currentStatus);

    if (!success) {
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

    // 更新当前详情
    setSelectedDetail(prev => prev ? { ...prev, isFavorited: newStatus } : null);

    notifications.show({
      autoClose: 1500,
      title: newStatus ? '已收藏' : '已取消收藏',
      message: newStatus ? '题目已添加到收藏' : '题目已从收藏中移除',
      color: newStatus ? 'yellow' : 'gray',
    });
  }, [selectedQuestionId, favoriteQuestions]);

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
        <ComputerIcon size={64} className="mb-6 text-gray-400" />
        <h2 className="text-xl font-bold text-gray-800 mb-3">请使用电脑访问</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          代码编辑器需要较大屏幕才能正常使用，请在电脑端打开本页面
        </p>
        <a
          href="/bagu"
          className="mt-6 px-6 py-2.5 rounded-full text-sm font-medium text-white shadow-md flex items-center gap-1.5"
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          }}
        >
          <BookOpenIcon size={16} />
          去看八股文
        </a>
      </div>

      {/* [暂时注释] 载入模板确认弹窗 - 现改为直接保存并载入
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
      */}

      {/* 主内容区域 - PC端显示 */}
      <div className="relative z-10 hidden md:flex min-h-0 flex-1 overflow-hidden">
        {/* 左侧分类菜单 */}
        <QuestionSidebar
          ref={sidebarRef}
          questions={questions}
          questionsByCategory={questionsByCategory}
          selectedQuestionId={selectedQuestionId}
          selectedCategoryTag={selectedCategoryTag}
          expandedCategories={expandedCategories}
          onSelectQuestion={handleSelectChange}
          onToggleCategory={toggleCategory}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
          statusMap={statusMap}
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
                <Button onClick={handleSave} variant="light" radius="xl" size="sm" color="violet" leftSection={<SaveIcon size={14} />}>
                  保存
                </Button>
                {/* [已移至状态栏] 模板按钮 */}
                <Button
                  onClick={handleMarkAsSolved}
                  variant="light"
                  radius="xl"
                  size="sm"
                  color={isCurrentSolved ? 'green' : 'gray'}
                  leftSection={isCurrentSolved ? <CheckIcon size={14} /> : <ClockIcon size={14} />}
                >
                  {isCurrentSolved ? '已完成' : '标为完成'}
                </Button>
                <Button
                  onClick={handleToggleFavorite}
                  variant="light"
                  radius="xl"
                  size="sm"
                  color={isCurrentFavorited ? 'yellow' : 'gray'}
                  leftSection={isCurrentFavorited ? <StarFilledIcon size={14} /> : <StarIcon size={14} />}
                >
                  {isCurrentFavorited ? '已收藏' : '收藏'}
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
                        <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                          <NoteIcon size={14} />
                          题目描述
                        </h4>
                        <pre className="whitespace-pre-wrap font-sans text-gray-600 text-base leading-relaxed">{selectedDetail.description}</pre>
                      </div>
                    )}

                    {/* 用例 */}
                    {selectedDetail?.testCases && selectedDetail.testCases.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                          <TestIcon size={14} />
                          用例
                        </h4>
                        <div className="space-y-3">
                          {selectedDetail.testCases.map((testCase, index) => (
                            <div key={index} className="bg-gray-50/80 rounded-lg p-3 border border-gray-200/50 relative group">
                              <button
                                onClick={() => {
                                  const newCode = code.trimEnd() + '\n\n' + testCase.input;
                                  setCode(newCode);
                                  notifications.show({
                                    title: '已添加用例',
                                    message: '用例代码已添加到编辑器末尾',
                                    color: 'green',
                                  });
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-md bg-purple-100 hover:bg-purple-200 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="应用到代码区"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                              </button>
                              {testCase.description && (
                                <div className="text-sm text-purple-600 font-medium mb-2 pr-8">{testCase.description}</div>
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
                            <span className="transition-transform group-open:rotate-90">
                              <ChevronRightIcon size={12} />
                            </span>
                            <OpenQuestionsIcon size={14} />
                            思路解析
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
                        <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                          <RocketIcon size={14} />
                          进阶思考
                        </h4>
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
            <div style={{ height: `${codeHeightPercent}%`, minHeight: 0 }} className="flex flex-col">
              <div className="flex-1 min-h-0">
              <CodeEditorPanel
                code={code}
                onChange={onCodeChange}
                height="100%"
              />
              </div>
              {/* 代码统计状态栏 */}
              <div className="flex-shrink-0 px-3 py-1.5 bg-gray-100/80 border-t border-gray-200/50 text-xs text-gray-500 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setCode('');
                      resetExecutionResult();
                    }}
                    className="px-2 py-0.5 rounded hover:bg-gray-200/80 text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
                    title="清空代码区"
                  >
                    <TrashIcon size={12} />
                    清空
                  </button>
                  <button
                    onClick={handleLoadTemplate}
                    className="px-2 py-0.5 rounded hover:bg-gray-200/80 text-cyan-600 hover:text-cyan-700 transition-colors flex items-center gap-1"
                    title="保存当前代码并载入模板"
                  >
                    <TemplateIcon size={12} />
                    载入模板
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <span className={code.split('\n').length > CODE_MAX_LINES ? 'text-red-500 font-medium' : ''}>
                    行数: {code.split('\n').length} / {CODE_MAX_LINES}
                  </span>
                  <span className={code.length > CODE_MAX_CHARS ? 'text-red-500 font-medium' : ''}>
                    字符: {code.length.toLocaleString()} / {CODE_MAX_CHARS.toLocaleString()}
                  </span>
                </div>
              </div>
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
