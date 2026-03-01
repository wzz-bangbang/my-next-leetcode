// Sentry 服务端配置（Node.js 端）
import * as Sentry from '@sentry/nextjs';

const isDev = process.env.NODE_ENV === 'development';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 环境标识
  environment: process.env.NODE_ENV,

  // 开发和生产都启用
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 性能监控采样率
  tracesSampleRate: isDev ? 1.0 : 0.3,

  // 调试模式（需要时手动开启）
  // debug: true,

  // 忽略常见的无害错误
  ignoreErrors: [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
  ],
});
