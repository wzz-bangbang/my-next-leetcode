/**
 * 设计 Token - 统一管理项目主题配置
 */

// ============ 颜色系统 ============

// 主品牌渐变色
export const gradients = {
  // 主渐变 - 紫蓝
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  // 八股题页面 - 粉紫
  bagu: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  // 代码编辑器页面 - 蓝紫
  code: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  // 收藏 - 黄色
  favorite: 'linear-gradient(135deg, #f9e866 0%, #f6d365 100%)',
  // 随机模拟 - 粉红
  simulation: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
} as const;

// 页面主题色（用于各页面统一色调）
export const pageTheme = {
  bagu: {
    primary: '#a855f7', // purple-500
    primaryLight: '#e9d5ff', // purple-200
    accent: '#f472b6', // pink-400
  },
  code: {
    primary: '#6366f1', // indigo-500
    primaryLight: '#c7d2fe', // indigo-200
    accent: '#8b5cf6', // violet-500
  },
  favorites: {
    primary: '#eab308', // yellow-500
    primaryLight: '#fef08a', // yellow-200
  },
} as const;

// 状态颜色
export const statusColors = {
  success: '#22c55e', // green-500
  warning: '#f59e0b', // amber-500
  error: '#ef4444', // red-500
  info: '#3b82f6', // blue-500
} as const;

// ============ 圆角系统 ============

export const radius = {
  // 按钮圆角 - 统一使用 lg
  button: 'rounded-lg',
  // 小按钮/标签
  tag: 'rounded-md',
  // 卡片圆角
  card: 'rounded-xl',
  // 大卡片/容器
  container: 'rounded-2xl',
  // 输入框
  input: 'rounded-lg',
  // 弹窗
  modal: 'rounded-xl',
} as const;

// Mantine 组件圆角映射
export const mantineRadius = {
  button: 'md', // 对应 rounded-lg
  card: 'lg',
  modal: 'lg',
} as const;

// ============ 图标尺寸系统 ============

export const iconSize = {
  // 极小 - 箭头、小按钮内图标
  xs: 12,
  // 小 - 普通按钮内图标
  sm: 14,
  // 中等 - 导航、标题旁图标
  md: 16,
  // 大 - 页面标题、弹窗标题
  lg: 20,
  // 超大 - 页面标题装饰
  xl: 24,
  // 占位图标 - 空状态
  placeholder: 48,
  // 超大占位
  hero: 64,
} as const;

// ============ 间距系统 ============

export const spacing = {
  // 按钮内边距
  buttonPadding: {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-6 py-2.5',
  },
  // 卡片内边距
  cardPadding: {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  },
} as const;

// ============ 渐变边框样式类名 ============

// 用于 className 的渐变边框样式
export const gradientBorderClass = {
  // 主渐变边框（激活态按钮）
  primary: 'gradient-border-primary',
  // 八股题主题
  bagu: 'gradient-border-bagu',
  // 代码编辑器主题
  code: 'gradient-border-code',
  // 收藏主题
  favorite: 'gradient-border-favorite',
} as const;

// ============ 组件样式预设 ============

// 按钮基础样式
export const buttonBase = `
  inline-flex items-center justify-center gap-1.5
  font-medium transition-all duration-200
  ${radius.button}
`;

// 按钮变体
export const buttonVariants = {
  // 渐变边框按钮（默认/未激活）
  outline: `
    bg-white/80 backdrop-blur-sm
    border-2 border-transparent
    hover:shadow-md
  `,
  // 渐变边框按钮（激活态）
  active: `
    bg-white backdrop-blur-sm
    shadow-md
  `,
  // 轻量按钮
  light: `
    bg-white/60 hover:bg-white/80
    text-gray-600 hover:text-gray-900
  `,
  // 幽灵按钮
  ghost: `
    bg-transparent hover:bg-white/40
    text-gray-600 hover:text-gray-900
  `,
} as const;

// 卡片基础样式
export const cardBase = `
  bg-white/80 backdrop-blur-sm
  ${radius.card}
  shadow-sm
`;

// ============ 导出类型 ============

export type GradientKey = keyof typeof gradients;
export type RadiusKey = keyof typeof radius;
export type IconSizeKey = keyof typeof iconSize;
