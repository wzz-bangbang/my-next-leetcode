import type { BaguData } from '@/types/bagu';

// 缓存数据
let cachedData: BaguData | null = null;
let fetchPromise: Promise<BaguData> | null = null;

// 获取数据（带缓存）- 从 API 获取
export async function getBaguData(): Promise<BaguData> {
  // 如果已缓存，直接返回
  if (cachedData) {
    return cachedData;
  }

  // 如果正在请求中，返回同一个 Promise
  if (fetchPromise) {
    return fetchPromise;
  }

  // 发起请求 - 从数据库 API 获取
  fetchPromise = fetch('/api/bagu')
    .then((res) => res.json())
    .then((data: BaguData) => {
      cachedData = data;
      return data;
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

// 预加载数据（空闲时调用）
export function preloadBaguData() {
  if (cachedData || fetchPromise) return;

  // 使用 requestIdleCallback 在空闲时预加载
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        getBaguData();
      });
    } else {
      // fallback: 延迟加载
      setTimeout(() => {
        getBaguData();
      }, 2000);
    }
  }
}

// 检查是否已缓存
export function isBaguDataCached(): boolean {
  return cachedData !== null;
}

// 获取缓存的数据（同步，可能为 null）
export function getCachedBaguData(): BaguData | null {
  return cachedData;
}
