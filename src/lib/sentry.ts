/**
 * Sentry 工具函数
 * 用于在 API 路由和服务端代码中捕获和上报错误
 */

import * as Sentry from '@sentry/nextjs';

/**
 * 捕获并上报错误到 Sentry
 * @param error 错误对象
 * @param context 额外上下文信息
 */
export function captureError(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: { id?: string; email?: string; username?: string };
  }
) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Dev Error]', error);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.user) {
      scope.setUser(context.user);
    }

    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error), 'error');
    }
  });
}

/**
 * 包装 API 路由处理函数，自动捕获错误
 * @param handler 原始处理函数
 * @param routeName 路由名称（用于标识）
 */
export function withErrorCapture<T extends (...args: never[]) => Promise<Response>>(
  handler: T,
  routeName: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      captureError(error, {
        tags: { route: routeName },
      });

      // 返回通用错误响应
      return new Response(
        JSON.stringify({ error: '服务器错误，请稍后重试' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }) as T;
}

/**
 * 记录性能指标
 * @param name 指标名称
 * @param value 指标值（毫秒）
 */
export function recordMetric(name: string, value: number) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Metric] ${name}: ${value}ms`);
    return;
  }

  Sentry.metrics.distribution(name, value, {
    unit: 'millisecond',
  });
}

/**
 * 手动开始一个性能追踪 span
 * @param name span 名称
 * @param fn 要执行的函数
 */
export async function withSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return Sentry.startSpan({ name, op: 'function' }, async () => {
    return await fn();
  });
}
