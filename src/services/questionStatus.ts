/**
 * 题目状态相关 API
 */
import { apiGet, apiPost, apiPut } from '@/lib/api';

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

/** 批量设置题目状态（迁移用） */
export async function batchSetQuestionStatus(statusList: Array<{ questionId: number; status: number }>, questionType: string) {
  return apiPut<{ message: string }>('/api/question-status', { statusList, questionType }, {
    showLoginOnUnauthorized: false,
  });
}
