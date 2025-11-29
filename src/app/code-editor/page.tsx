'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { javascript } from '@codemirror/lang-javascript';
import { Select, Button, Modal, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), { ssr: false });

interface Question {
  id: string;
  title: string;
}

function CodeEditorPage() {
  const [isClient, setIsClient] = useState(false);
  const [code, setCode] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [executionResult, setExecutionResult] = useState<string>('Execution results will be shown here.');
  const sandboxRef = useRef<HTMLIFrameElement | null>(null);
  const [isSandboxReady, setIsSandboxReady] = useState(false);

  // Hydration fix and cleanup on unmount
  useEffect(() => {
    setIsClient(true);

    const handleMessage = (event: MessageEvent) => {
      // Security: check the origin of the message
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
      
      setExecutionResult(output || 'Code executed.'); // Show something if no output
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
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
            // Removed automatic loading of saved code on initial load.
          }
        });
    }
  }, [isClient]);

  useEffect(() => {
    if (selectedQuestionId) {
      localStorage.setItem('selectedQuestionId', selectedQuestionId);
    }
  }, [selectedQuestionId]);

  const handleSelectChange = (value: string | null) => {
    if (value && value !== selectedQuestionId) {
      // 如果代码编辑区有内容，则弹出确认框
      if (code.trim()) {
        setPendingQuestionId(value);
        openModal();
      } else {
        // 如果代码编辑区为空，则直接切换题目
        setSelectedQuestionId(value);
        setCode(''); // Clear editor
        setExecutionResult('Execution results will be shown here.'); // Clear output
      }
    }
  };

  const confirmChange = () => {
    if (pendingQuestionId) {
      setSelectedQuestionId(pendingQuestionId);
      setCode(''); // Clear editor
      setExecutionResult('Execution results will be shown here.'); // Clear output
      setPendingQuestionId(null); // Reset pending ID
    }
    closeModal();
  };

  const handleExecute = () => {
    if (sandboxRef.current && sandboxRef.current.contentWindow) {
      setExecutionResult('Executing...');
      sandboxRef.current.contentWindow.postMessage({ code }, window.location.origin);
    }
  };

  const handleSave = async () => {
    if (!selectedQuestionId) {
      notifications.show({
        title: '操作失败',
        message: '请先选择一个题目',
        color: 'yellow',
      });
      return;
    }
    if (!code.trim()) {
      notifications.show({
        title: '提示',
        message: '代码内容不能为空，无法保存。',
        color: 'yellow',
      });
      return;
    }
    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: selectedQuestionId, code }),
      });
      if (res.ok) {
        notifications.show({
          title: '操作成功',
          message: '代码已保存！',
          color: 'green',
        });
      } else {
        notifications.show({
          title: '操作失败',
          message: '保存失败，请稍后再试。',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Save failed:', error);
      notifications.show({
        title: '网络错误',
        message: '保存时发生错误，请检查网络连接。',
        color: 'red',
      });
    }
  };

  const handleLoad = async () => {
    if (selectedQuestionId) {
      setExecutionResult('Execution results will be shown here.'); // Clear previous results
      try {
        const res = await fetch(`/api/answers?questionId=${selectedQuestionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.code) {
            setCode(data.code);
            notifications.show({
              title: '加载成功',
              message: '已加载上次保存的代码。',
              color: 'green',
            });
          } else {
            notifications.show({
              title: '提示',
              message: '当前题目没有已保存的代码。',
              color: 'blue',
            });
          }
        } else {
           notifications.show({
            title: '加载失败',
            message: '无法获取历史代码，请稍后再试。',
            color: 'red',
          });
        }
      } catch (error) {
        console.error('Load failed:', error);
        notifications.show({
          title: '网络错误',
          message: '加载代码时发生错误，请检查网络连接。',
          color: 'red',
        });
      }
    } else {
      notifications.show({
        title: '提示',
        message: '请先选择一个题目',
        color: 'blue',
      });
    }
  };

  const onCodeChange = useCallback((value: string) => {
    setCode(value);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <>
      {isClient && (
        <Modal opened={modalOpened} onClose={closeModal} title="确认" centered>
          <p>确定清除当前代码吗？切换后，当前未保存的代码将会丢失。</p>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeModal}>取消</Button>
            <Button color="red" onClick={confirmChange}>确定</Button>
          </Group>
        </Modal>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px', borderBottom: '1px solid #e0e0e0', gap: '10px' }}>
          <div style={{ flex: '0 0 auto' }}>
            {isClient && (
               <Select
                placeholder="选择题目"
                value={selectedQuestionId}
                onChange={handleSelectChange}
                data={questions.map(q => ({ value: q.id, label: q.title }))}
                style={{ width: '200px' }}
              />
            )}
          </div>
          <div style={{ flex: '1 1 auto', textAlign: 'center' }}>
            <Button.Group>
                <Button onClick={handleExecute} variant="outline" disabled={!isSandboxReady}>
                  {isSandboxReady ? 'Execute' : 'Loading Sandbox...'}
                </Button>
                <Button onClick={handleSave} variant="outline">保存</Button>
                <Button onClick={handleLoad} variant="outline">载入上次代码</Button>
            </Button.Group>
          </div>
          <div style={{ flex: '0 0 200px' }} />
        </div>
        <div style={{ display: 'flex', flex: 1, overflow: 'auto' }}>
          <div style={{ flex: 2, overflow: 'auto' }}>
            <CodeMirror
              value={code}
              height="100%"
              extensions={[javascript({ jsx: true })]}
              onChange={onCodeChange}
            />
          </div>
          <iframe
            ref={sandboxRef}
            src="/sandbox.html"
            style={{ display: 'none' }}
            sandbox="allow-scripts allow-same-origin"
          />
          <div style={{ width: '5px', background: '#f0f0f0', cursor: 'ew-resize' }} />
          <div style={{ flex: 1, padding: '10px', background: '#f9f9f9', overflow: 'auto' }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {executionResult}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}

export default CodeEditorPage;
