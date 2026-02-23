/**
 * 收藏管理工具
 * 支持两种类型：bagu（八股文）和 code（代码题）
 */
import * as favoritesApi from '@/services/favorites';

// localStorage keys
const FAVORITES_BAGU_KEY = 'favorites-bagu';
const FAVORITES_CODE_KEY = 'favorites-code';

export type FavoriteType = 'bagu' | 'code';

// 获取收藏列表（从本地缓存）
export function getFavorites(type: FavoriteType): Set<number> {
  if (typeof window === 'undefined') return new Set();
  const key = type === 'bagu' ? FAVORITES_BAGU_KEY : FAVORITES_CODE_KEY;
  try {
    const data = localStorage.getItem(key);
    const arr = data ? JSON.parse(data) : [];
    return new Set(arr.map((id: number | string) => Number(id)));
  } catch {
    return new Set();
  }
}

// 设置收藏状态（同时更新本地缓存和服务器）
export function setFavorite(type: FavoriteType, questionId: number, isFavorite: boolean): void {
  if (typeof window === 'undefined') return;
  const key = type === 'bagu' ? FAVORITES_BAGU_KEY : FAVORITES_CODE_KEY;
  const set = getFavorites(type);

  if (isFavorite) {
    set.add(questionId);
  } else {
    set.delete(questionId);
  }

  localStorage.setItem(key, JSON.stringify([...set]));

  // 同步到服务器
  favoritesApi.toggleFavorite(type, questionId, isFavorite);
}

// 切换收藏状态
export function toggleFavorite(type: FavoriteType, questionId: number): boolean {
  const favorites = getFavorites(type);
  const newStatus = !favorites.has(questionId);
  setFavorite(type, questionId, newStatus);
  return newStatus;
}

// 检查是否已收藏
export function isFavorited(type: FavoriteType, questionId: number): boolean {
  return getFavorites(type).has(questionId);
}

// 从服务器加载收藏（初始化时调用）
export async function loadFavoritesFromServer(type: FavoriteType): Promise<Set<number>> {
  const { ok, data } = await favoritesApi.loadFavorites(type);
  if (ok && data) {
    const ids: number[] = (data.ids || []).map((id: number | string) => Number(id));
    // 同步到 localStorage
    const key = type === 'bagu' ? FAVORITES_BAGU_KEY : FAVORITES_CODE_KEY;
    localStorage.setItem(key, JSON.stringify(ids));
    return new Set(ids);
  }
  return getFavorites(type);
}
