// 八股文题目列表项（不含内容）
export interface BaguQuestionListItem {
  id: number;
  slug: string;
  title: string;
  hasAnswer: boolean;
}

// 八股文题目详情（含内容和状态）
export interface BaguQuestionDetail extends BaguQuestionListItem {
  categoryId: number;
  content: string | null;
  isFavorited: boolean;
}

// 八股文分类（列表用）
export interface BaguCategory {
  id: number;
  slug: string;
  name: string;
  icon?: string | null;
  questions: BaguQuestionListItem[];
}

// 八股文列表数据
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
