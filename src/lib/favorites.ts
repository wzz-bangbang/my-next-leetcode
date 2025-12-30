/**
 * 收藏管理工具
 * 支持两种类型：bagu（八股文）和 code（代码题）
 */

// localStorage keys
const FAVORITES_BAGU_KEY = 'favorites-bagu';
const FAVORITES_CODE_KEY = 'favorites-code';

export type FavoriteType = 'bagu' | 'code';

// 获取收藏列表
export function getFavorites(type: FavoriteType): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const key = type === 'bagu' ? FAVORITES_BAGU_KEY : FAVORITES_CODE_KEY;
  try {
    const data = localStorage.getItem(key);
    return new Set(data ? JSON.parse(data) : []);
  } catch {
    return new Set();
  }
}

// 设置收藏状态
export function setFavorite(type: FavoriteType, questionId: string, isFavorite: boolean): void {
  if (typeof window === 'undefined') return;
  const key = type === 'bagu' ? FAVORITES_BAGU_KEY : FAVORITES_CODE_KEY;
  const set = getFavorites(type);
  
  if (isFavorite) {
    set.add(questionId);
  } else {
    set.delete(questionId);
  }
  
  localStorage.setItem(key, JSON.stringify([...set]));
  
  // 同时保存到 JSON 文件（通过 API）
  saveFavoritesToServer(type, [...set]);
}

// 切换收藏状态
export function toggleFavorite(type: FavoriteType, questionId: string): boolean {
  const favorites = getFavorites(type);
  const newStatus = !favorites.has(questionId);
  setFavorite(type, questionId, newStatus);
  return newStatus;
}

// 检查是否已收藏
export function isFavorited(type: FavoriteType, questionId: string): boolean {
  return getFavorites(type).has(questionId);
}

// 保存到服务器
async function saveFavoritesToServer(type: FavoriteType, ids: string[]): Promise<void> {
  try {
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ids }),
    });
  } catch (error) {
    console.error('Save favorites to server failed:', error);
  }
}

// 从服务器加载收藏（初始化时调用）
export async function loadFavoritesFromServer(type: FavoriteType): Promise<Set<string>> {
  try {
    const res = await fetch(`/api/favorites?type=${type}`);
    if (res.ok) {
      const data = await res.json();
      const ids: string[] = data.ids || [];
      // 同步到 localStorage
      const key = type === 'bagu' ? FAVORITES_BAGU_KEY : FAVORITES_CODE_KEY;
      localStorage.setItem(key, JSON.stringify(ids));
      return new Set(ids);
    }
  } catch (error) {
    console.error('Load favorites from server failed:', error);
  }
  return getFavorites(type);
}

