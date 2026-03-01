'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 上报错误到 Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            fontFamily: 'system-ui, sans-serif',
            backgroundColor: '#1a1a2e',
            color: '#eee',
          }}
        >
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>😵 出错了</h1>
          <p style={{ color: '#aaa', marginBottom: '2rem', textAlign: 'center' }}>
            页面发生了一些问题，我们已经收到错误报告。
          </p>
          <button
            onClick={reset}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4338ca')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#4f46e5')}
          >
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
