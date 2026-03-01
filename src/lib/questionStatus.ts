import * as questionStatusApi from '@/services/questionStatus';

// 题目状态枚举
export enum QuestionStatus {
  NOT_DONE = 0,    // 没做过
  ATTEMPTED = 1,   // 做过
  SOLVED = 2,      // 已解决
}

// 题目类型枚举
export enum QuestionType {
  CODE = 1,   // 代码题
  BAGU = 2,   // 八股文
}

// 类型字符串到枚举的映射（兼容旧代码）
type QuestionTypeKey = 'code' | 'bagu';
const typeKeyToEnum: Record<QuestionTypeKey, QuestionType> = {
  code: QuestionType.CODE,
  bagu: QuestionType.BAGU,
};

// 内存缓存（避免频繁请求）
const statusCache: Record<QuestionType, Record<number, QuestionStatus>> = {
  [QuestionType.CODE]: {},
  [QuestionType.BAGU]: {},
};
const cacheLoaded: Record<QuestionType, boolean> = {
  [QuestionType.CODE]: false,
  [QuestionType.BAGU]: false,
};
// 防止并发请求
const loadingPromise: Record<QuestionType, Promise<Record<number, QuestionStatus>> | null> = {
  [QuestionType.CODE]: null,
  [QuestionType.BAGU]: null,
};

// 从服务器加载状态
export async function loadQuestionStatusFromServer(type: QuestionTypeKey): Promise<Record<number, QuestionStatus>> {
  const typeEnum = typeKeyToEnum[type];

  // 如果已加载，直接返回缓存
  if (cacheLoaded[typeEnum]) {
    return statusCache[typeEnum];
  }

  // 如果正在加载，返回现有 promise
  if (loadingPromise[typeEnum]) {
    return loadingPromise[typeEnum]!;
  }

  // 发起新请求
  loadingPromise[typeEnum] = (async () => {
    try {
      const { ok, data } = await questionStatusApi.loadQuestionStatus(typeEnum);
      if (ok && data) {
        const serverMap = data.statusMap || {};
        const numericMap: Record<number, QuestionStatus> = {};
        Object.entries(serverMap).forEach(([key, value]) => {
          numericMap[Number(key)] = value as QuestionStatus;
        });
        statusCache[typeEnum] = numericMap;
        cacheLoaded[typeEnum] = true;
        return statusCache[typeEnum];
      }
    } catch (error) {
      console.error('Load question status failed:', error);
    } finally {
      loadingPromise[typeEnum] = null;
    }
    return {};
  })();

  return loadingPromise[typeEnum]!;
}

// 获取所有题目状态（优先返回缓存）
export function getQuestionStatusMap(type: QuestionTypeKey): Record<number, QuestionStatus> {
  const typeEnum = typeKeyToEnum[type];
  return statusCache[typeEnum] || {};
}

// 检查缓存是否已加载
export function isStatusCacheLoaded(type: QuestionTypeKey): boolean {
  const typeEnum = typeKeyToEnum[type];
  return cacheLoaded[typeEnum];
}

// 获取单个题目状态
export function getQuestionStatus(questionId: number, type: QuestionTypeKey): QuestionStatus {
  const typeEnum = typeKeyToEnum[type];
  return statusCache[typeEnum]?.[questionId] ?? QuestionStatus.NOT_DONE;
}

/**
 * 设置单个题目状态（服务端优先）
 * @returns { success: boolean, finalStatus: QuestionStatus } - 是否成功 + 最终状态
 */
export async function setQuestionStatus(
  questionId: number,
  status: QuestionStatus,
  type: QuestionTypeKey
): Promise<{ success: boolean; finalStatus: QuestionStatus }> {
  const typeEnum = typeKeyToEnum[type];
  const oldStatus = statusCache[typeEnum]?.[questionId] ?? QuestionStatus.NOT_DONE;

  // 先请求服务器
  const { ok } = await questionStatusApi.saveQuestionStatus(questionId, typeEnum, status);

  if (ok) {
    // 服务器成功后更新缓存
    if (!statusCache[typeEnum]) {
      statusCache[typeEnum] = {};
    }
    statusCache[typeEnum][questionId] = status;
    return { success: true, finalStatus: status };
  }

  // 服务器失败，返回旧状态
  return { success: false, finalStatus: oldStatus };
}

// 清除缓存（用于刷新数据）
export function clearStatusCache(type?: QuestionTypeKey) {
  if (type) {
    const typeEnum = typeKeyToEnum[type];
    statusCache[typeEnum] = {};
    cacheLoaded[typeEnum] = false;
  } else {
    statusCache[QuestionType.CODE] = {};
    statusCache[QuestionType.BAGU] = {};
    cacheLoaded[QuestionType.CODE] = false;
    cacheLoaded[QuestionType.BAGU] = false;
  }
}
