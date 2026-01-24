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

// 测试用例接口
export interface TestCase {
  input: string;        // 输入描述或代码
  expected: string;     // 预期输出
  description?: string; // 用例说明（可选）
}

// 题目列表项（不含详情）
export interface QuestionListItem {
  id: number;
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: CategoryTag[];
}

// 题目详情（含详情和状态）
export interface QuestionDetail extends QuestionListItem {
  description?: string;
  testCases?: TestCase[];
  template?: string;
  solution?: string;
  followUp?: string[];
  isFavorited: boolean;
}

// 兼容旧类型
export interface Question extends QuestionListItem {
  description?: string;
  testCases?: TestCase[];
  template?: string;
  solution?: string;
  followUp?: string[];
}
