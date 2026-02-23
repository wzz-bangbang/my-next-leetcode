/**
 * 收藏相关 API
 */
import { apiGet, apiPost, apiPatch } from '@/lib/api';

export type FavoriteType = 'bagu' | 'code';

/** 加载收藏列表 */
export async function loadFavorites(type: FavoriteType) {
  return apiGet<{ ids: number[] }>(`/api/favorites?type=${type}`, {
    showLoginOnUnauthorized: false, // 读取不提示登录
  });
}

/** 切换单个收藏状态 */
export async function toggleFavorite(type: FavoriteType, questionId: number, isFavorite: boolean) {
  return apiPatch<{ message: string }>('/api/favorites', { type, questionId, isFavorite });
}

/** 批量设置收藏（迁移用） */
export async function batchSetFavorites(type: FavoriteType, ids: number[]) {
  return apiPost<{ message: string }>('/api/favorites', { type, ids }, {
    showLoginOnUnauthorized: false,
  });
}
