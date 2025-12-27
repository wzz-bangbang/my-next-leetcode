'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Modal, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import Header from '@/components/Header';
import CodeEditorPanel from '@/components/CodeEditorPanel';
import ExecutionResultPanel from '@/components/ExecutionResultPanel';
import QuestionSidebar, { QuestionStatus, setQuestionStatus, getQuestionStatusMap } from '@/components/QuestionSidebar';
import { CategoryTag, Difficulty, DifficultyLabel, DifficultyColor, CategoryTagLabel } from '@/types/question';

interface Question {
  id: string;
  title: string;
  difficulty: number;
  tags: number[];
  description?: string;
}

function CodeEditorPage() {
  const [isClient, setIsClient] = useState(false);
  const [code, setCode] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [clearModalOpened, { open: openClearModal, close: closeClearModal }] = useDisclosure(false);
  const [executionResult, setExecutionResult] = useState<string>('执行结果将在这里显示');
  const sandboxRef = useRef<HTMLIFrameElement | null>(null);
  const [isSandboxReady, setIsSandboxReady] = useState(false);
  
  // 展开的分类
  const [expandedCategories, setExpandedCategories] = useState<Set<CategoryTag>>(new Set());
  
  // 拖拽分隔条相关状态
  const [descWidthPercent, setDescWidthPercent] = useState(28); // 描述区域占比
  const [codeHeightPercent, setCodeHeightPercent] = useState(65); // 代码区域高度占比
  const [isDraggingH, setIsDraggingH] = useState(false); // 水平拖拽
  const [isDraggingV, setIsDraggingV] = useState(false); // 垂直拖拽
  const mainContainerRef = useRef<HTMLDivElement | null>(null);
  const codeContainerRef = useRef<HTMLDivElement | null>(null);

  // 按分类组织题目
  const questionsByCategory = useMemo(() => {
    const map = new Map<CategoryTag, Question[]>();
    
    // 初始化所有分类
    Object.values(CategoryTag).filter(v => typeof v === 'number').forEach(tag => {
      map.set(tag as CategoryTag, []);
    });
    
    // 将题目分配到各分类
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

  // 获取当前选中的题目
  const selectedQuestion = useMemo(() => {
    return questions.find(q => q.id === selectedQuestionId);
  }, [questions, selectedQuestionId]);

  // 侧边栏更新触发器
  const [sidebarKey, setSidebarKey] = useState(0);

  // 切换分类展开状态
  const toggleCategory = (tag: CategoryTag) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  // 更新题目状态并刷新侧边栏
  const markQuestionAsAttempted = useCallback((questionId: string) => {
    const currentStatusMap = getQuestionStatusMap();
    const currentStatus = currentStatusMap[questionId];
    // 只有在没做过的情况下才标记为"做过"（NOT_DONE = 0，undefined也视为没做过）
    if (currentStatus === undefined || currentStatus === QuestionStatus.NOT_DONE) {
      setQuestionStatus(questionId, QuestionStatus.ATTEMPTED);
      setSidebarKey(prev => prev + 1); // 触发侧边栏刷新
    }
  }, []);

  // Hydration fix and cleanup on unmount
  useEffect(() => {
    setIsClient(true);

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'sandbox-ready') {
        setIsSandboxReady(true);
        return;
      }

      const { type, result, logs, error } = event.data;
      let output = logs ? logs.join('\n') : '';

      if (type === 'result') {
        if (result !== 'undefined') {
           output += `\n\nReturn Value:\n${result}`;
        }
      } else if (type === 'error') {
        output += `\n\nError:\n${error}`;
      }
      
      setExecutionResult(output || '代码已执行');
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // 同步已有答案的题目状态
  const syncQuestionStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/answers');
      if (res.ok) {
        const data = await res.json();
        const answeredIds: string[] = data.answeredIds || [];
        const currentStatusMap = getQuestionStatusMap();
        let hasChanges = false;
        
        answeredIds.forEach(id => {
          // 只有当前状态是 NOT_DONE 或 undefined 时才更新为 ATTEMPTED
          if (currentStatusMap[id] === undefined || currentStatusMap[id] === QuestionStatus.NOT_DONE) {
            setQuestionStatus(id, QuestionStatus.ATTEMPTED);
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          setSidebarKey(prev => prev + 1); // 刷新侧边栏显示
        }
      }
    } catch (error) {
      console.error('Sync question status failed:', error);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      fetch('/questions.json')
        .then((res) => res.json())
        .then((data) => {
          setQuestions(data);
          const lastSelectedId = localStorage.getItem('selectedQuestionId');
          const initialId = lastSelectedId || data[0]?.id;
          if (initialId) {
            setSelectedQuestionId(initialId);
            // 自动展开包含该题目的分类
            const question = data.find((q: Question) => q.id === initialId);
            if (question) {
              setExpandedCategories(new Set(question.tags));
            }
          }
        });
      
      // 同步已有答案的题目状态
      syncQuestionStatus();
    }
  }, [isClient, syncQuestionStatus]);

  useEffect(() => {
    if (selectedQuestionId) {
      localStorage.setItem('selectedQuestionId', selectedQuestionId);
    }
  }, [selectedQuestionId]);

  // 切换题目时自动加载历史代码
  const loadSavedCode = useCallback(async (questionId: string) => {
    try {
      const res = await fetch(`/api/answers?questionId=${questionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.code) {
          setCode(data.code);
        } else {
          setCode('');
        }
      }
    } catch (error) {
      console.error('Auto load failed:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedQuestionId && isClient) {
      setExecutionResult('执行结果将在这里显示');
      loadSavedCode(selectedQuestionId);
    }
  }, [selectedQuestionId, isClient, loadSavedCode]);

  const handleSelectChange = async (value: string | null) => {
    if (value && value !== selectedQuestionId) {
      // 检查当前代码是否有修改
      let hasChanges = false;
      
      if (code.trim() && selectedQuestionId) {
        try {
          const res = await fetch(`/api/answers?questionId=${selectedQuestionId}`);
          if (res.ok) {
            const data = await res.json();
            const savedCode = data.code || '';
            // 比较当前代码和保存的代码是否不同
            hasChanges = code.trim() !== savedCode.trim();
          } else {
            // 获取失败时，如果有代码就认为有修改
            hasChanges = true;
          }
        } catch {
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        setPendingQuestionId(value);
        openModal();
      } else {
        setSelectedQuestionId(value);
        setCode('');
        setExecutionResult('执行结果将在这里显示');
      }
    }
  };

  const confirmChange = () => {
    if (pendingQuestionId) {
      setSelectedQuestionId(pendingQuestionId);
      setCode('');
      setExecutionResult('执行结果将在这里显示');
      setPendingQuestionId(null);
    }
    closeModal();
  };

  const handleExecute = () => {
    if (sandboxRef.current && sandboxRef.current.contentWindow) {
      setExecutionResult('执行中...');
      sandboxRef.current.contentWindow.postMessage({ code }, window.location.origin);
    }
  };

  const handleSave = async () => {
    if (!selectedQuestionId) {
      notifications.show({ title: '操作失败', message: '请先选择一个题目', color: 'yellow' });
      return;
    }
    if (!code.trim()) {
      notifications.show({ title: '提示', message: '代码内容不能为空', color: 'yellow' });
      return;
    }
    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: selectedQuestionId, code }),
      });
      if (res.ok) {
        markQuestionAsAttempted(selectedQuestionId); // 标记为做过
        notifications.show({ title: '保存成功', message: '代码已保存！', color: 'green' });
      } else {
        notifications.show({ title: '保存失败', message: '请稍后再试', color: 'red' });
      }
    } catch (error) {
      console.error('Save failed:', error);
      notifications.show({ title: '网络错误', message: '保存时发生错误', color: 'red' });
    }
  };

  const handleLoad = async () => {
    if (!selectedQuestionId) {
      notifications.show({ title: '提示', message: '请先选择一个题目', color: 'blue' });
      return;
    }
    setExecutionResult('执行结果将在这里显示');
    try {
      const res = await fetch(`/api/answers?questionId=${selectedQuestionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.code) {
          setCode(data.code);
          notifications.show({ title: '加载成功', message: '已加载保存的代码', color: 'green' });
        } else {
          notifications.show({ title: '提示', message: '当前题目没有保存的代码', color: 'blue' });
        }
      } else {
        notifications.show({ title: '加载失败', message: '请稍后再试', color: 'red' });
      }
    } catch (error) {
      console.error('Load failed:', error);
      notifications.show({ title: '网络错误', message: '加载时发生错误', color: 'red' });
    }
  };

  // 清空代码 - 打开确认弹窗
  const handleClear = () => {
    if (!code.trim()) {
      notifications.show({ title: '提示', message: '代码已经是空的', color: 'blue' });
      return;
    }
    openClearModal();
  };

  // 清空并保存
  const handleClearWithSave = async () => {
    if (!selectedQuestionId) {
      closeClearModal();
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
        notifications.show({ title: '保存成功', message: '代码已保存', color: 'green' });
      }
    } catch (error) {
      console.error('Save failed:', error);
    }
    setCode('');
    setExecutionResult('执行结果将在这里显示');
    closeClearModal();
  };

  // 直接清空不保存
  const handleClearWithoutSave = () => {
    setCode('');
    setExecutionResult('执行结果将在这里显示');
    closeClearModal();
    notifications.show({ title: '已清空', message: '代码已清空', color: 'blue' });
  };

  // 标记为已完成
  const handleMarkAsSolved = () => {
    if (!selectedQuestionId) {
      notifications.show({ title: '提示', message: '请先选择一个题目', color: 'yellow' });
      return;
    }
    setQuestionStatus(selectedQuestionId, QuestionStatus.SOLVED);
    setSidebarKey(prev => prev + 1);
    notifications.show({ title: '🎉 恭喜', message: '已标记为完成！', color: 'green' });
  };

  const onCodeChange = useCallback((value: string) => {
    setCode(value);
  }, []);

  // 水平拖拽处理（描述区宽度）
  const handleMouseDownH = useCallback(() => {
    setIsDraggingH(true);
  }, []);

  const handleMouseMoveH = useCallback((e: MouseEvent) => {
    if (!isDraggingH || !mainContainerRef.current) return;
    
    const container = mainContainerRef.current;
    const rect = container.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const containerWidth = rect.width;
    
    // 计算百分比，限制在20%-40%之间，最小300px
    let percent = (offsetX / containerWidth) * 100;
    const minPercent = Math.max(20, (300 / containerWidth) * 100);
    percent = Math.max(minPercent, Math.min(40, percent));
    
    setDescWidthPercent(percent);
  }, [isDraggingH]);

  // 垂直拖拽处理（代码区高度）
  const handleMouseDownV = useCallback(() => {
    setIsDraggingV(true);
  }, []);

  const handleMouseMoveV = useCallback((e: MouseEvent) => {
    if (!isDraggingV || !codeContainerRef.current) return;
    
    const container = codeContainerRef.current;
    const rect = container.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const containerHeight = rect.height;
    
    // 计算百分比，限制在50%-90%之间
    let percent = (offsetY / containerHeight) * 100;
    percent = Math.max(50, Math.min(90, percent));
    
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

      {/* 公共头部 */}
      <Header />

      {/* 切换题目确认弹窗 */}
      {isClient && (
        <Modal opened={modalOpened} onClose={closeModal} title="确认" centered>
          <p>确定切换题目吗？当前未保存的代码将会丢失。</p>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeModal}>取消</Button>
            <Button color="red" onClick={confirmChange}>确定</Button>
          </Group>
        </Modal>
      )}

      {/* 清空代码确认弹窗 */}
      {isClient && (
        <Modal opened={clearModalOpened} onClose={closeClearModal} title="清空代码" centered>
          <p>是否保存当前代码后再清空？</p>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeClearModal}>取消</Button>
            <Button color="orange" onClick={handleClearWithoutSave}>不保存</Button>
            <Button color="violet" onClick={handleClearWithSave}>保存后清空</Button>
          </Group>
        </Modal>
      )}

      {/* 主内容区域 */}
      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        {/* 左侧分类菜单 */}
        <QuestionSidebar
          key={sidebarKey}
          questions={questions}
          questionsByCategory={questionsByCategory}
          selectedQuestionId={selectedQuestionId}
          expandedCategories={expandedCategories}
          onSelectQuestion={handleSelectChange}
          onToggleCategory={toggleCategory}
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
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{selectedQuestion.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span 
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ 
                        backgroundColor: `${DifficultyColor[selectedQuestion.difficulty as Difficulty]}20`,
                        color: DifficultyColor[selectedQuestion.difficulty as Difficulty]
                      }}
                    >
                      {DifficultyLabel[selectedQuestion.difficulty as Difficulty]}
                    </span>
                    {selectedQuestion.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-600">
                        {CategoryTagLabel[tag as CategoryTag]}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">请从左侧选择一道题目</p>
              )}
            </div>
            
            {/* 操作按钮 */}
            <div className="flex-shrink-0 px-5 py-3 border-b border-gray-200/50 bg-white/20">
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} variant="light" radius="xl" size="xs" color="violet">
                  💾 保存
                </Button>
                <Button onClick={handleLoad} variant="light" radius="xl" size="xs" color="indigo">
                  📂 载入
                </Button>
                <Button onClick={handleClear} variant="light" radius="xl" size="xs" color="pink">
                  🗑️ 清空
                </Button>
                <Button onClick={handleMarkAsSolved} variant="light" radius="xl" size="xs" color="green">
                  ✅ 标为完成
                </Button>
              </div>
            </div>

            {/* 题目描述 */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5">
              {selectedQuestion?.description ? (
                <div className="text-gray-600 text-sm leading-relaxed">
                  <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">📝 题目描述</h4>
                  <p>{selectedQuestion.description}</p>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
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
              sandbox="allow-scripts allow-same-origin"
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
                result={executionResult}
                onExecute={handleExecute}
                isReady={isSandboxReady}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeEditorPage;
