import type { ComponentType } from 'react';
import {
  JsAnalysisIcon,
  JsHandwriteIcon,
  TsTypeIcon,
  ReactIcon,
  AlgorithmIcon,
  type IconProps,
} from '@/components/icons';

// 代码题分类枚举
export enum CodeCategoryId {
  JS_ANALYSIS = 1,
  JS_HANDWRITE = 2,
  TS_TYPE = 3,
  REACT = 4,
  // HTML_CSS = 5,
  ALGORITHM = 6,
}

// 分类信息映射
export const CodeCategories: Record<CodeCategoryId, { name: string; Icon: ComponentType<IconProps> }> = {
  [CodeCategoryId.JS_ANALYSIS]: { name: 'JS代码分析题', Icon: JsAnalysisIcon },
  [CodeCategoryId.JS_HANDWRITE]: { name: 'JS手写题', Icon: JsHandwriteIcon },
  [CodeCategoryId.TS_TYPE]: { name: 'TS类型题', Icon: TsTypeIcon },
  [CodeCategoryId.REACT]: { name: 'React代码题', Icon: ReactIcon },
  // [CodeCategoryId.HTML_CSS]: { name: 'HTML和CSS', Icon: CssHtmlIcon },
  [CodeCategoryId.ALGORITHM]: { name: '算法题', Icon: AlgorithmIcon },
};

// 获取分类名称
export function getCategoryName(id: CodeCategoryId): string {
  return CodeCategories[id]?.name || '';
}

// 获取分类图标组件
export function getCategoryIcon(id: CodeCategoryId): ComponentType<IconProps> | null {
  return CodeCategories[id]?.Icon || null;
}
