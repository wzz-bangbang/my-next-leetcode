/**
 * 代码答案相关 API
 */
import { apiPost } from '@/lib/api';
import * as Sentry from '@sentry/nextjs';

/** 保存代码答案 */
export async function saveAnswer(questionId: number, code: string) {
  const result = await apiPost<{ message: string }>('/api/answers', { questionId, code });
  
  // 保存失败时上报
  if (!result.ok) {
    Sentry.captureMessage('保存代码失败', {
      level: 'error',
      tags: { feature: 'code-editor', action: 'save-answer' },
      extra: { questionId, codeLength: code.length, error: result.error, status: result.status },
    });
  }
  
  return result;
}
