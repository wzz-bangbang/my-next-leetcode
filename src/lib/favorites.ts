/**
 * 收藏管理工具
 * 服务端优先，本地缓存仅用于快速读取
 */
import * as favoritesApi from '@/services/favorites';

export type FavoriteType = 'bagu' | 'code';

// 内存缓存
const favoritesCache: Record<FavoriteType, Set<number>> = {
  bagu: new Set(),
  code: new Set(),
};
const cacheLoaded: Record<FavoriteType, boolean> = {
  bagu: false,
  code: false,
};

// 从服务器加载收藏（初始化时调用）
export async function loadFavoritesFromServer(type: FavoriteType): Promise<Set<number>> {
  const { ok, data } = await favoritesApi.loadFavorites(type);
  if (ok && data) {
    const ids: number[] = (data.ids || []).map((id: number | string) => Number(id));
    favoritesCache[type] = new Set(ids);
    cacheLoaded[type] = true;
    return favoritesCache[type];
  }
  return favoritesCache[type];
}

// 获取收藏列表（从缓存）
export function getFavorites(type: FavoriteType): Set<number> {
  return favoritesCache[type];
}

// 检查缓存是否已加载
export function isFavoritesCacheLoaded(type: FavoriteType): boolean {
  return cacheLoaded[type];
}

// 检查是否已收藏
export function isFavorited(type: FavoriteType, questionId: number): boolean {
  return favoritesCache[type].has(questionId);
}

/**
 * 切换收藏状态（服务端优先）
 * @returns { success: boolean, newStatus: boolean } - 是否成功 + 新状态
 */
export async function toggleFavorite(
  type: FavoriteType,
  questionId: number
): Promise<{ success: boolean; newStatus: boolean }> {
  const currentStatus = favoritesCache[type].has(questionId);
  const newStatus = !currentStatus;

  // 先请求服务器
  const { ok } = await favoritesApi.toggleFavorite(type, questionId, newStatus);

  if (ok) {
    // 服务器成功后更新缓存
    if (newStatus) {
      favoritesCache[type].add(questionId);
    } else {
      favoritesCache[type].delete(questionId);
    }
    return { success: true, newStatus };
  }

  // 服务器失败，返回失败状态
  return { success: false, newStatus: currentStatus };
}

/**
 * 设置收藏状态（服务端优先）
 * @returns boolean - 是否成功
 */
export async function setFavorite(
  type: FavoriteType,
  questionId: number,
  isFavorite: boolean
): Promise<boolean> {
  // 先请求服务器
  const { ok } = await favoritesApi.toggleFavorite(type, questionId, isFavorite);

  if (ok) {
    // 服务器成功后更新缓存
    if (isFavorite) {
      favoritesCache[type].add(questionId);
    } else {
      favoritesCache[type].delete(questionId);
    }
    return true;
  }

  return false;
}

// 清除缓存
export function clearFavoritesCache(type?: FavoriteType) {
  if (type) {
    favoritesCache[type] = new Set();
    cacheLoaded[type] = false;
  } else {
    favoritesCache.bagu = new Set();
    favoritesCache.code = new Set();
    cacheLoaded.bagu = false;
    cacheLoaded.code = false;
  }
}
