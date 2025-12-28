'use client';

import { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import dynamic from 'next/dynamic';

// 懒加载代码高亮组件
const SyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then((mod) => mod.Prism),
  {
    loading: () => (
      <pre className="bg-gray-800 text-gray-300 p-4 rounded-lg my-4 text-sm">
        代码加载中...
      </pre>
    ),
    ssr: false,
  }
);

// 懒加载主题
const getOneDarkStyle = () =>
  import('react-syntax-highlighter/dist/esm/styles/prism').then(
    (mod) => mod.oneDark
  );

// 代码块组件
function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [style, setStyle] = useState<Record<string, React.CSSProperties>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    getOneDarkStyle().then(setStyle);
    // 检测是否为移动端
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');

  if (match || codeString.includes('\n')) {
    return (
      <SyntaxHighlighter
        style={style}
        language={match ? match[1] : 'javascript'}
        PreTag="div"
        customStyle={{
          margin: isMobile ? '0.75em 0' : '1em 0',
          padding: isMobile ? '0.5rem' : '1rem',
          borderRadius: '0.5rem',
          fontSize: isMobile ? '0.625rem' : '0.95rem',
          lineHeight: '1.5',
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    );
  }

  return <code className={className}>{children}</code>;
}

interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  // 预处理内容
  const processedContent = useMemo(() => {
    return content
      .replace(/<mark>/gi, '**')
      .replace(/<\/mark>/gi, '**');
  }, [content]);

  return (
    <div className="markdown-content text-base">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code: CodeBlock,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

