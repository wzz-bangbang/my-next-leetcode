'use client';

import { useState } from 'react';
import { Button } from '@mantine/core';

export default function MigratePage() {
  const [log, setLog] = useState<string[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);

  const addLog = (msg: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const migrateData = async () => {
    setIsMigrating(true);
    setLog([]);
    addLog('开始迁移...');

    try {
      // 1. 迁移代码题答案
      addLog('正在读取 localStorage 中的代码答案...');
      const answersRaw = localStorage.getItem('code-answers');
      if (answersRaw) {
        const answers = JSON.parse(answersRaw);
        const entries = Object.entries(answers);
        addLog(`找到 ${entries.length} 条代码答案`);

        for (const [questionId, code] of entries) {
          if (code && typeof code === 'string' && code.trim()) {
            const res = await fetch('/api/answers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ questionId, categoryTag: 0, code }),
            });
            if (res.ok) {
              addLog(`✓ 代码答案已迁移: ${questionId}`);
            } else {
              addLog(`✗ 代码答案迁移失败: ${questionId}`);
            }
          }
        }
      } else {
        addLog('未找到代码答案数据');
      }

      // 2. 迁移题目状态
      addLog('正在读取 localStorage 中的题目状态...');
      const statusRaw = localStorage.getItem('question-status-map');
      if (statusRaw) {
        const statusMap = JSON.parse(statusRaw);
        const statusList = Object.entries(statusMap).map(([questionId, status]) => ({
          questionId,
          status: status as number,
        }));
        addLog(`找到 ${statusList.length} 条题目状态`);

        if (statusList.length > 0) {
          const res = await fetch('/api/question-status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statusList, questionType: 'code' }),
          });
          if (res.ok) {
            addLog(`✓ 题目状态已批量迁移: ${statusList.length} 条`);
          } else {
            addLog('✗ 题目状态迁移失败');
          }
        }
      } else {
        addLog('未找到题目状态数据');
      }

      // 3. 迁移收藏数据
      addLog('正在读取 localStorage 中的收藏数据...');
      const favoritesRaw = localStorage.getItem('favorites-code');
      if (favoritesRaw) {
        const favorites = JSON.parse(favoritesRaw);
        if (Array.isArray(favorites) && favorites.length > 0) {
          addLog(`找到 ${favorites.length} 条收藏数据`);
          const res = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'code', ids: favorites }),
          });
          if (res.ok) {
            addLog(`✓ 收藏数据已迁移: ${favorites.length} 条`);
          } else {
            addLog('✗ 收藏数据迁移失败');
          }
        } else {
          addLog('收藏列表为空');
        }
      } else {
        addLog('未找到收藏数据');
      }

      addLog('迁移完成！');
    } catch (error) {
      addLog(`迁移出错: ${error}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const clearLocalStorage = () => {
    if (confirm('确定要清除 localStorage 中的旧数据吗？此操作不可恢复！')) {
      localStorage.removeItem('code-answers');
      localStorage.removeItem('question-status-map');
      localStorage.removeItem('favorites-code');
      addLog('已清除 localStorage 旧数据');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">数据迁移工具</h1>
        <p className="text-gray-600 mb-6">
          将 localStorage 中的数据迁移到 MySQL 数据库
        </p>

        <div className="flex gap-4 mb-6">
          <Button
            onClick={migrateData}
            loading={isMigrating}
            color="violet"
            size="md"
          >
            开始迁移
          </Button>
          <Button
            onClick={clearLocalStorage}
            color="red"
            variant="outline"
            size="md"
            disabled={isMigrating}
          >
            清除旧数据
          </Button>
        </div>

        <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm h-96 overflow-y-auto">
          {log.length === 0 ? (
            <p className="text-gray-500">点击&ldquo;开始迁移&rdquo;按钮...</p>
          ) : (
            log.map((line, i) => <div key={i}>{line}</div>)
          )}
        </div>
      </div>
    </div>
  );
}
