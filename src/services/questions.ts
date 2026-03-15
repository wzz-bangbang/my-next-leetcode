/**
 * 题目相关 API
 */
import { apiGet } from '@/lib/api';
import type { QuestionListItem, QuestionDetail } from '@/types/question';
import type { BaguData, BaguQuestionDetail } from '@/types/bagu';

/** 获取代码题列表 */
export async function getCodeQuestionList() {
  return apiGet<QuestionListItem[]>('/api/code', {
    showLoginOnUnauthorized: false,
  });
}

/** 获取代码题详情 */
export async function getCodeQuestionDetail(questionId: number) {
  return apiGet<QuestionDetail>(`/api/code?id=${questionId}`, {
    showLoginOnUnauthorized: false,
  });
}

/** 获取八股题列表 */
export async function getBaguList() {
  return apiGet<BaguData>('/api/bagu', {
    showLoginOnUnauthorized: false,
  });
}

/** 获取八股题详情 */
export async function getBaguDetail(questionId: number) {
  return apiGet<BaguQuestionDetail>(`/api/bagu?id=${questionId}`, {
    showLoginOnUnauthorized: false,
  });
}
