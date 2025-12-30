'use client';

import React from 'react';
import { Button } from '@mantine/core';

interface ExecutionResultPanelProps {
  result: string;
  onExecute: () => void;
  isReady: boolean;
}

export default function ExecutionResultPanel({ result, onExecute, isReady }: ExecutionResultPanelProps) {
  return (
    <div className="h-full flex flex-col min-h-0 bg-gray-50/80 backdrop-blur-sm">
      <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200/50 bg-white/30 flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">📋 执行结果</span>
        <Button
          onClick={onExecute}
          disabled={!isReady}
          radius="xl"
          size="xs"
          style={{
            background: isReady ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
            boxShadow: isReady ? '0 4px 14px rgba(102,126,234,0.4)' : undefined,
          }}
        >
          {isReady ? '▶ 执行代码' : '加载中...'}
        </Button>
      </div>
      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
        <pre className="whitespace-pre-wrap break-all text-sm text-gray-700 font-mono">
          {result}
        </pre>
      </div>
    </div>
  );
}



