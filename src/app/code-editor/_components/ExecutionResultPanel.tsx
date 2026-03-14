'use client';

import React from 'react';
import { Button } from '@mantine/core';
import { ClipboardIcon, MonitorIcon, ErrorIcon, PlayIcon } from '@/components/icons';

interface ExecutionResultPanelProps {
  consoleLogs: string[];
  returnValue: string;
  error: string;
  onExecute: () => void;
  isReady: boolean;
  isExecuting: boolean;
}

export default function ExecutionResultPanel({ 
  consoleLogs, 
  returnValue, 
  error,
  onExecute,
  isReady, 
  isExecuting 
}: ExecutionResultPanelProps) {
  const canExecute = isReady && !isExecuting;
  const hasConsole = consoleLogs.length > 0;
  const hasReturn = returnValue !== '';
  const hasError = error !== '';
  
  return (
    <div className="h-full flex flex-col min-h-0 bg-gray-50/80 backdrop-blur-sm">
      {/* 头部 */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200/50 bg-white/30 flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
          <ClipboardIcon size={14} />
          执行结果
        </span>
        <Button
          onClick={onExecute}
          disabled={!canExecute}
          loading={isExecuting}
          radius="xl"
          size="xs"
          leftSection={!isExecuting && <PlayIcon size={12} />}
          style={{
            background: canExecute ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
            boxShadow: canExecute ? '0 4px 14px rgba(102,126,234,0.4)' : undefined,
          }}
        >
          {!isReady ? '加载中...' : isExecuting ? '执行中...' : '执行代码'}
        </Button>
      </div>
      
      {/* 内容区域 */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Console 输出区域 */}
        <div className="flex-1 min-h-0 flex flex-col border-b border-gray-200/50">
          <div className="flex-shrink-0 px-3 py-1.5 bg-gray-100/50 text-xs text-gray-500 font-medium flex items-center gap-1.5">
            <MonitorIcon size={14} />
            Console {hasConsole && <span className="text-gray-400">({consoleLogs.length})</span>}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            {hasConsole ? (
              <pre className="whitespace-pre-wrap break-all text-sm text-gray-700 font-mono">
                {consoleLogs.join('\n')}
              </pre>
            ) : (
              <span className="text-xs text-gray-400 italic">暂无输出</span>
            )}
          </div>
        </div>
        
        {/* 错误区域（仅在有错误时显示） */}
        {hasError && (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-shrink-0 px-3 py-1.5 bg-gray-100/50 text-xs text-gray-500 font-medium flex items-center gap-1.5">
              <ErrorIcon size={14} className="text-red-500" />
              Error
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              <pre className="whitespace-pre-wrap break-all text-sm text-red-600 font-mono">
                {error}
              </pre>
            </div>
          </div>
        )}

        {/* 
          [暂时隐藏] Return Value 区域
          原因：最后一行表达式的值容易造成误导（如 setTimeout 返回 timer ID）
          后续可考虑：智能过滤、添加说明提示、或用户手动开关
          
        {!hasError && (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-shrink-0 px-3 py-1.5 bg-gray-100/50 text-xs text-gray-500 font-medium">
              📤 Return Value
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              {hasReturn ? (
                <pre className="whitespace-pre-wrap break-all text-sm text-emerald-600 font-mono">
                  {returnValue}
                </pre>
              ) : (
                <span className="text-xs text-gray-400 italic">暂无返回值</span>
              )}
            </div>
          </div>
        )}
        */}
      </div>
    </div>
  );
}
