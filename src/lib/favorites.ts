/**
 * 收藏管理工具
 * 纯服务端调用，无本地缓存
 */
import * as favoritesApi from '@/services/favorites';

export type FavoriteType = 'bagu' | 'code';

/**
 * 从服务器加载收藏列表
 */
export async function loadFavoritesFromServer(type: FavoriteType): Promise<Set<number>> {
  const { ok, data } = await favoritesApi.loadFavorites(type);
  if (ok && data) {
    const ids: number[] = (data.ids || []).map((id: number | string) => Number(id));
    return new Set(ids);
  }
  return new Set();
}

/**
 * 切换收藏状态（服务端优先）
 * @param currentStatus 当前收藏状态（由调用方传入）
 * @returns { success: boolean, newStatus: boolean, status?: number }
 */
export async function toggleFavorite(
  type: FavoriteType,
  questionId: number,
  currentStatus: boolean
): Promise<{ success: boolean; newStatus: boolean; status?: number }> {
  const newStatus = !currentStatus;

  const { ok, status } = await favoritesApi.toggleFavorite(type, questionId, newStatus);

  if (ok) {
    return { success: true, newStatus };
  }

  return { success: false, newStatus: currentStatus, status };
}
