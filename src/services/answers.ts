/**
 * 代码答案相关 API
 */
import { apiPost } from '@/lib/api';

/** 保存代码答案 */
export async function saveAnswer(questionId: number, code: string) {
  return apiPost<{ message: string }>('/api/answers', { questionId, code });
}
