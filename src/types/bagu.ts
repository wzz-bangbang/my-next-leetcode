// 八股文题目
export interface BaguQuestion {
  id: string; // 唯一ID
  title: string; // 题目标题
  content: string; // Markdown 内容
  hasAnswer: boolean; // 是否有答案
}

// 八股文分类
export interface BaguCategory {
  id: string; // 唯一ID，不会变
  name: string; // 显示名称
  isFolder?: boolean; // 是否是文件夹类型（每个文件=一道题）
  questions: BaguQuestion[];
}

// 八股文数据
export interface BaguData {
  categories: BaguCategory[];
  generatedAt: string; // 生成时间
}
