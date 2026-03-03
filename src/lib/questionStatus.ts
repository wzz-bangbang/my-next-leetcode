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

// 类型字符串到枚举的映射
type QuestionTypeKey = 'code' | 'bagu';
const typeKeyToEnum: Record<QuestionTypeKey, QuestionType> = {
  code: QuestionType.CODE,
  bagu: QuestionType.BAGU,
};

/**
 * 从服务器加载题目状态
 */
export async function loadQuestionStatusFromServer(type: QuestionTypeKey): Promise<Record<number, QuestionStatus>> {
  const typeEnum = typeKeyToEnum[type];
  
  try {
    const { ok, data } = await questionStatusApi.loadQuestionStatus(typeEnum);
    if (ok && data) {
      const serverMap = data.statusMap || {};
      const numericMap: Record<number, QuestionStatus> = {};
      Object.entries(serverMap).forEach(([key, value]) => {
        numericMap[Number(key)] = value as QuestionStatus;
      });
      return numericMap;
    }
  } catch (error) {
    console.error('Load question status failed:', error);
  }
  return {};
}

/**
 * 设置单个题目状态（服务端优先）
 * @returns { success: boolean, finalStatus: QuestionStatus, httpStatus?: number }
 */
export async function setQuestionStatus(
  questionId: number,
  status: QuestionStatus,
  type: QuestionTypeKey,
  currentStatus: QuestionStatus = QuestionStatus.NOT_DONE
): Promise<{ success: boolean; finalStatus: QuestionStatus; httpStatus?: number }> {
  const typeEnum = typeKeyToEnum[type];

  const { ok, status: httpStatus } = await questionStatusApi.saveQuestionStatus(questionId, typeEnum, status);

  if (ok) {
    return { success: true, finalStatus: status };
  }

  return { success: false, finalStatus: currentStatus, httpStatus };
}
