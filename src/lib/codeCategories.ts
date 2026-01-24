// 代码题分类枚举
export enum CodeCategoryId {
  JS_ANALYSIS = 1,
  JS_HANDWRITE = 2,
  TS_TYPE = 3,
  REACT = 4,
  ALGORITHM = 6,
}

// 分类信息映射
export const CodeCategories: Record<CodeCategoryId, { name: string; icon: string }> = {
  [CodeCategoryId.JS_ANALYSIS]: { name: 'JS代码分析题', icon: '🔍' },
  [CodeCategoryId.JS_HANDWRITE]: { name: 'JS手写题', icon: '✍️' },
  [CodeCategoryId.TS_TYPE]: { name: 'TS类型题', icon: '📘' },
  [CodeCategoryId.REACT]: { name: 'React代码题', icon: '⚛️' },
  [CodeCategoryId.ALGORITHM]: { name: '算法题', icon: '🧮' },
};

// 获取分类名称
export function getCategoryName(id: CodeCategoryId): string {
  return CodeCategories[id]?.name || '';
}

// 获取分类图标
export function getCategoryIcon(id: CodeCategoryId): string {
  return CodeCategories[id]?.icon || '';
}
