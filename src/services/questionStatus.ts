/**
 * 题目状态相关 API
 */
import { apiGet, apiPost } from '@/lib/api';

/** 加载题目状态 */
export async function loadQuestionStatus(type: number) {
  return apiGet<{ statusMap: Record<string, number> }>(`/api/question-status?type=${type}`, {
    showLoginOnUnauthorized: false, // 读取不提示登录
  });
}

/** 保存单个题目状态 */
export async function saveQuestionStatus(questionId: number, questionType: number, status: number) {
  return apiPost<{ message: string }>('/api/question-status', { questionId, questionType, status });
}
