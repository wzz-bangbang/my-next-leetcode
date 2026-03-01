/**
 * 用户行为追踪
 * - 记录页面访问和题目浏览
 * - 数据存储到后端 + Sentry breadcrumbs
 */
import * as Sentry from '@sentry/nextjs';

// 事件类型
export type TrackEvent = 
  | 'page_view'           // 页面浏览
  | 'question_view'       // 查看题目
  | 'question_solved'     // 完成题目
  | 'code_save'           // 保存代码
  | 'favorite_add'        // 添加收藏
  | 'favorite_remove';    // 取消收藏

// 事件数据
interface TrackData {
  page?: string;
  questionId?: number;
  questionTitle?: string;
  type?: 'bagu' | 'code';
  [key: string]: unknown;
}

/**
 * 追踪用户行为
 * @param event 事件名称
 * @param data 事件数据
 */
export function track(event: TrackEvent, data?: TrackData) {
  // 1. 添加到 Sentry breadcrumbs（发生错误时可以看到用户之前的操作）
  Sentry.addBreadcrumb({
    category: 'user-action',
    message: event,
    level: 'info',
    data,
  });

  // 2. 开发环境打印日志
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, data);
  }

  // 3. 发送到后端（异步，不阻塞用户操作）
  sendToServer(event, data).catch(() => {
    // 埋点失败不影响用户体验
  });
}

/**
 * 发送到后端存储
 */
async function sendToServer(event: TrackEvent, data?: TrackData) {
  // 只在生产环境发送，或者开发环境也想测试时可以去掉这个判断
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        data,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.pathname : '',
      }),
    });
  } catch {
    // 静默失败
  }
}

/**
 * 追踪页面浏览（在页面组件中调用）
 */
export function trackPageView(page: string) {
  track('page_view', { page });
}

/**
 * 追踪题目浏览
 */
export function trackQuestionView(questionId: number, questionTitle: string, type: 'bagu' | 'code') {
  track('question_view', { questionId, questionTitle, type });
}
