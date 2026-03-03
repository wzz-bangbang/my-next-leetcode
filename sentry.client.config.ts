// Sentry 客户端配置（浏览器端）
import * as Sentry from '@sentry/nextjs';

// 根据环境设置采样率
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 环境标识（用于在 Sentry 控制台筛选）
  environment: process.env.NODE_ENV, // 'development' | 'production' | 'test'

  // 开发和生产都启用，但采样率不同
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 性能监控采样率
  // 开发环境：100%（方便调试）
  // 生产环境：30%（节省额度）
  tracesSampleRate: isDev ? 1.0 : 0.3,

  // Session Replay 采样率（仅生产环境）
  replaysSessionSampleRate: isProd ? 0.1 : 0,
  replaysOnErrorSampleRate: isProd ? 1.0 : 0,

  // 集成配置
  integrations: [
    Sentry.replayIntegration({
      // 隐私保护：遮挡所有文本和输入
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // 调试模式（需要时手动开启）
  // debug: true,

  // 忽略常见的无害错误
  ignoreErrors: [
    // 浏览器扩展错误
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // 网络错误
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    // 用户取消
    'AbortError',
    // Sentry 自身脚本错误
    'has no method',
    'updateFrom',
  ],

  // 忽略来自第三方脚本的错误
  denyUrls: [
    // 浏览器扩展
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
    /^safari-extension:\/\//i,
  ],

  // 发送前处理
  beforeSend(event) {
    const errorMessage = event.exception?.values?.[0]?.value || '';
    
    // 只过滤已知的 Sentry 内部错误（精确匹配）
    const isKnownSentryBug = 
      errorMessage.includes('updateFrom') ||
      errorMessage.includes('has no method \'updateFrom\'');
    
    if (isKnownSentryBug) {
      console.log('[Sentry] Filtered internal error:', errorMessage);
      return null;
    }

    // 开发环境同时打印到控制台
    if (isDev) {
      console.log('[Sentry Dev] Sending event:', event.event_id, errorMessage || event.message);
    }
    return event;
  },
});
