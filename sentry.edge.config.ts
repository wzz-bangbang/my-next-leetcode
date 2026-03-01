// Sentry Edge 配置（Middleware 等边缘运行时）
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
});
