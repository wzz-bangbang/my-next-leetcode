/**
 * 收藏相关 API
 */
import { apiGet, apiPatch } from '@/lib/api';
import * as Sentry from '@sentry/nextjs';

export type FavoriteType = 'bagu' | 'code';

/** 加载收藏列表 */
export async function loadFavorites(type: FavoriteType) {
  return apiGet<{ ids: number[] }>(`/api/favorites?type=${type}`, {
    showLoginOnUnauthorized: false, // 读取不提示登录
  });
}

/** 切换单个收藏状态 */
export async function toggleFavorite(type: FavoriteType, questionId: number, isFavorite: boolean) {
  const result = await apiPatch<{ message: string }>('/api/favorites', { type, questionId, isFavorite });
  
  // 收藏操作失败时上报（排除未登录的情况）
  if (!result.ok && result.status !== 401) {
    Sentry.captureMessage('收藏操作失败', {
      level: 'error',
      tags: { feature: 'favorites', action: isFavorite ? 'add' : 'remove' },
      extra: { type, questionId, isFavorite, error: result.error, status: result.status },
    });
  }
  
  return result;
}
