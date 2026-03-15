// 八股题题目列表项（不含内容）
export interface BaguQuestionListItem {
  id: number;
  slug: string;
  title: string;
  hasAnswer: boolean;
}

// 八股题题目详情（含内容和状态）
export interface BaguQuestionDetail extends BaguQuestionListItem {
  categoryId: number;
  content: string | null;
  isFavorited: boolean;
  userStatus?: number; // 用户完成状态: 0=未做, 1=尝试中, 2=已完成
}

// 八股题分类（列表用）
export interface BaguCategory {
  id: number;
  slug: string;
  name: string;
  icon?: string | null;
  questions: BaguQuestionListItem[];
}

// 八股题列表数据
export interface BaguListData {
  categories: BaguCategory[];
}

// 兼容旧类型
export interface BaguQuestion extends BaguQuestionListItem {
  content?: string | null;
}

export interface BaguData {
  categories: BaguCategory[];
}
