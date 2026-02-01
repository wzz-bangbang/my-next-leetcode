// 八股文分类枚举
export enum BaguCategoryId {
  JS_BASIC = 1,
  TYPESCRIPT = 2,
  CSS_HTML = 3,
  REACT = 4,
  VUE = 5,
  BROWSER = 6,
  NEXTJS = 7,
  ENGINEERING = 8,
  CICD = 9,
  OPEN_QUESTIONS = 10,
  MINIPROGRAM = 11,
  AI = 12,
  TECH_SELECTION = 13,
  TEAMWORK = 14,
}

// 分类信息映射（包含 icon）
export const BaguCategories: Record<BaguCategoryId, { slug: string; name: string; icon: string }> = {
  [BaguCategoryId.JS_BASIC]: { slug: 'js-basic', name: 'JS基础', icon: '📜' },
  [BaguCategoryId.TYPESCRIPT]: { slug: 'typescript', name: 'TypeScript', icon: '📘' },
  [BaguCategoryId.CSS_HTML]: { slug: 'css-html', name: 'CSS & HTML', icon: '🎨' },
  [BaguCategoryId.REACT]: { slug: 'react', name: 'React', icon: '⚛️' },
  [BaguCategoryId.VUE]: { slug: 'vue', name: 'Vue', icon: '💚' },
  [BaguCategoryId.BROWSER]: { slug: 'browser', name: '浏览器', icon: '🌐' },
  [BaguCategoryId.NEXTJS]: { slug: 'nextjs', name: 'Next.js', icon: '▲' },
  [BaguCategoryId.ENGINEERING]: { slug: 'engineering', name: '工程化', icon: '🔧' },
  [BaguCategoryId.CICD]: { slug: 'cicd', name: 'CI&CD', icon: '🚀' },
  [BaguCategoryId.OPEN_QUESTIONS]: { slug: 'open-questions', name: '开放题&场景题', icon: '💡' },
  [BaguCategoryId.MINIPROGRAM]: { slug: 'miniprogram', name: '小程序', icon: '📱' },
  [BaguCategoryId.AI]: { slug: 'ai', name: 'AI', icon: '🤖' },
  [BaguCategoryId.TECH_SELECTION]: { slug: 'tech-selection', name: '技术选型', icon: '⚖️' },
  [BaguCategoryId.TEAMWORK]: { slug: 'teamwork', name: '工作协作', icon: '🤝' },
};

// 获取分类图标
export function getCategoryIcon(id: BaguCategoryId): string {
  return BaguCategories[id]?.icon || '';
}

// 根据 slug 获取分类 ID
export function getCategoryIdBySlug(slug: string): BaguCategoryId | undefined {
  for (const [id, info] of Object.entries(BaguCategories)) {
    if (info.slug === slug) {
      return Number(id) as BaguCategoryId;
    }
  }
  return undefined;
}

// 根据分类 ID 获取 slug
export function getSlugByCategoryId(id: BaguCategoryId): string {
  return BaguCategories[id]?.slug || '';
}
