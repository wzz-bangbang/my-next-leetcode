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

// 分类信息映射
export const BaguCategories: Record<BaguCategoryId, { slug: string; name: string }> = {
  [BaguCategoryId.JS_BASIC]: { slug: 'js-basic', name: 'JS基础' },
  [BaguCategoryId.TYPESCRIPT]: { slug: 'typescript', name: 'TypeScript' },
  [BaguCategoryId.CSS_HTML]: { slug: 'css-html', name: 'CSS & HTML' },
  [BaguCategoryId.REACT]: { slug: 'react', name: 'React' },
  [BaguCategoryId.VUE]: { slug: 'vue', name: 'Vue' },
  [BaguCategoryId.BROWSER]: { slug: 'browser', name: '浏览器' },
  [BaguCategoryId.NEXTJS]: { slug: 'nextjs', name: 'Next.js' },
  [BaguCategoryId.ENGINEERING]: { slug: 'engineering', name: '工程化' },
  [BaguCategoryId.CICD]: { slug: 'cicd', name: 'CI&CD' },
  [BaguCategoryId.OPEN_QUESTIONS]: { slug: 'open-questions', name: '开放题&场景题' },
  [BaguCategoryId.MINIPROGRAM]: { slug: 'miniprogram', name: '小程序' },
  [BaguCategoryId.AI]: { slug: 'ai', name: 'AI' },
  [BaguCategoryId.TECH_SELECTION]: { slug: 'tech-selection', name: '技术选型' },
  [BaguCategoryId.TEAMWORK]: { slug: 'teamwork', name: '工作协作' },
};

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
