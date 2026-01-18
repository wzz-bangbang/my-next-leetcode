// 难度枚举
export enum Difficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
}

// 难度显示映射
export const DifficultyLabel: Record<Difficulty, string> = {
  [Difficulty.EASY]: '简单',
  [Difficulty.MEDIUM]: '中等',
  [Difficulty.HARD]: '困难',
};

export const DifficultyColor: Record<Difficulty, string> = {
  [Difficulty.EASY]: '#52c41a',
  [Difficulty.MEDIUM]: '#faad14',
  [Difficulty.HARD]: '#f5222d',
};

// 分类标签枚举
export enum CategoryTag {
  JS_ANALYSIS = 1,
  JS_HANDWRITE = 2,
  TS_TYPES = 3,
  REACT = 4,
  // HTML_CSS = 5,
  ALGORITHM = 6,
}

// 分类标签显示映射
export const CategoryTagLabel: Record<CategoryTag, string> = {
  [CategoryTag.JS_ANALYSIS]: 'JS代码分析题',
  [CategoryTag.JS_HANDWRITE]: 'JS手写题',
  [CategoryTag.TS_TYPES]: 'TS类型题',
  [CategoryTag.REACT]: 'React代码题',
  // [CategoryTag.HTML_CSS]: 'HTML和CSS',
  [CategoryTag.ALGORITHM]: '算法题',
};

// 题目接口
export interface Question {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: CategoryTag[];
  description?: string;
}
