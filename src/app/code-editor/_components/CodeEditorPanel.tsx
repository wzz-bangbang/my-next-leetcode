'use client';

import React, { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { javascript } from '@codemirror/lang-javascript';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), { ssr: false });

interface CodeEditorPanelProps {
  code: string;
  onChange: (value: string) => void;
  height?: string;
}

export default function CodeEditorPanel({ code, onChange, height = '100%' }: CodeEditorPanelProps) {
  const handleChange = useCallback((value: string) => {
    onChange(value);
  }, [onChange]);

  return (
    <div className="h-full w-full bg-white/70 backdrop-blur-sm flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-auto">
        <CodeMirror
          value={code}
          height={height}
          style={{ height: '100%' }}
          extensions={[javascript({ jsx: true })]}
          onChange={handleChange}
          theme="light"
        />
      </div>
    </div>
  );
}


