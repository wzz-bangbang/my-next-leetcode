# 按钮样式规范

本文件定义项目中按钮的统一样式规范，所有新增按钮应参考此文件。

## 1. 基础样式类

### 渐变边框按钮 (推荐)

```tsx
// 基础类名
className = 'btn-gradient-border btn-gradient-{theme}';

// 主题色可选值:
// - primary: 紫蓝渐变 (默认/登录按钮)
// - bagu: 紫粉渐变 (八股题相关)
// - code: 蓝紫渐变 (代码编辑器相关)
// - star: 橙黄渐变 (收藏按钮)
// - complete: 绿色渐变 (完成状态/未完成筛选)
// - simulation: 粉红渐变 (随机模拟)
```

### 选中状态

```tsx
// 添加 active 类或 data-active 属性
className="btn-gradient-border btn-gradient-bagu active"
// 或
data-active={isActive}
```

## 2. 字号规范

使用 Tailwind 标准字号类，在 `globals.css` 的 `@theme inline` 中定义：

| 类名        | 尺寸            | 用途             |
| ----------- | --------------- | ---------------- |
| `text-2xs`  | 0.625rem (10px) | 移动端小按钮     |
| `text-xs`   | 0.75rem (12px)  | 小按钮、导航按钮 |
| `text-sm`   | 0.875rem (14px) | 列表项、大按钮   |
| `text-base` | 1rem (16px)     | 正文             |

**重要**: 不要使用 `text-[0.xxx rem]` 这种自定义值，统一使用上述标准类。

## 3. 圆角规范

| 类型   | 圆角类         | 使用场景                         |
| ------ | -------------- | -------------------------------- |
| 全圆角 | `rounded-full` | 所有独立按钮、导航按钮、筛选按钮 |
| 大圆角 | `rounded-xl`   | 卡片、弹窗                       |
| 中圆角 | `rounded-lg`   | 输入框、下拉选择器               |

**重要**: 按钮统一使用 `rounded-full`

## 4. 尺寸规范

按钮分为两种尺寸：大按钮和小按钮

### 大按钮 (首页入口、导航、列表)

```tsx
// 首页主入口按钮
className = 'px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold';

// Header 导航按钮
className = 'px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium';

// 列表项
className = 'text-sm';
```

### 小按钮 (页面内操作、筛选)

```tsx
// PC端操作按钮 (收藏、完成、导航)
className = 'px-2 py-1 text-xs font-medium';

// 移动端紧凑按钮
className = 'px-1.5 py-0.5 text-2xs';

// 图标按钮 (无文字)
className = 'p-1.5';
```

### 图标尺寸 (使用 iconSize 常量)

```tsx
import { iconSize } from '@/styles/theme';

// xs: 12px - 小箭头、微型图标
// sm: 14px - 按钮内图标 (推荐)
// md: 16px - 导航、标题旁图标
// lg: 20px - 页面标题图标
// xl: 24px - 大标题装饰
// placeholder: 48px - 空状态图标
// hero: 64px - 超大占位图标
```

### 图标与文字间距

```tsx
// 推荐使用 gap
className = 'flex items-center gap-1'; // 紧凑
className = 'flex items-center gap-1.5'; // 标准 (推荐)
className = 'flex items-center gap-2'; // 宽松
```

## 5. 完整按钮示例

### 导航按钮

```tsx
<Link
  href="/bagu"
  data-active={isActive}
  className={`btn-gradient-border btn-gradient-bagu px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
    isActive ? 'active' : ''
  }`}>
  <span className="flex items-center gap-1.5">
    <BookOpenIcon size={iconSize.sm} />
    八股题
  </span>
</Link>
```

### 操作按钮 - 收藏 (橙黄)

```tsx
<button
  onClick={onToggleFavorite}
  data-active={isFavorited}
  className={`btn-gradient-border btn-gradient-star px-2 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
    isFavorited ? 'active' : ''
  }`}
  style={{
    backgroundColor: isFavorited ? 'rgba(251, 191, 36, 0.1)' : undefined,
  }}>
  {isFavorited ? <StarFilledIcon size={11} /> : <StarIcon size={11} />}
  <span>{isFavorited ? '已收藏' : '收藏'}</span>
</button>
```

### 操作按钮 - 完成 (绿色)

```tsx
<button
  onClick={onToggleComplete}
  data-active={isCompleted}
  className={`btn-gradient-border btn-gradient-complete px-2 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
    isCompleted ? 'active' : ''
  }`}
  style={{
    backgroundColor: isCompleted ? 'rgba(34, 197, 94, 0.1)' : undefined,
  }}>
  {isCompleted ? <CheckIcon size={11} /> : <ClockIcon size={11} />}
  <span>{isCompleted ? '已完成' : '未完成'}</span>
</button>
```

### 筛选按钮 - 未完成 (绿色)

```tsx
<button
  onClick={onToggle}
  data-active={isActive}
  className={`btn-gradient-border btn-gradient-complete flex-1 px-2 py-1.5 text-xs rounded-full transition-all flex items-center justify-center gap-1 ${
    isActive ? 'active' : ''
  }`}
  style={{
    backgroundColor: isActive ? 'rgba(34, 197, 94, 0.1)' : undefined,
  }}>
  {isActive && <CheckIcon size={iconSize.xs} />}
  未完成
</button>
```

### 筛选按钮 - 已收藏 (橙黄)

```tsx
<button
  onClick={onToggle}
  data-active={isActive}
  className={`btn-gradient-border btn-gradient-star flex-1 px-2 py-1.5 text-xs rounded-full transition-all flex items-center justify-center gap-1 ${
    isActive ? 'active' : ''
  }`}
  style={{
    backgroundColor: isActive ? 'rgba(251, 191, 36, 0.1)' : undefined,
  }}>
  {isActive && <CheckIcon size={iconSize.xs} />}
  已收藏
</button>
```

### 移动端小按钮

```tsx
<button className="btn-gradient-border btn-gradient-star px-1.5 py-0.5 rounded-full transition-all">
  <span className="text-2xs whitespace-nowrap flex items-center gap-0.5">
    <StarIcon size={9} />
    <span>收藏</span>
  </span>
</button>
```

### 图标按钮 (无文字)

```tsx
<button
  onClick={onCopy}
  className="btn-gradient-border btn-gradient-primary p-1.5 rounded-full transition-all">
  <CopyIcon size={iconSize.sm} />
</button>
```

## 6. 选中态背景色

筛选按钮选中时，使用低透明度背景色:

```tsx
style={{
  backgroundColor: isActive ? 'rgba(主题色, 0.1)' : undefined,
}}

// 常用颜色:
// - 收藏 (star): rgba(251, 191, 36, 0.1)
// - 完成/未完成筛选 (complete): rgba(34, 197, 94, 0.1)
// - 紫色 (bagu): rgba(168, 85, 247, 0.1)
// - 蓝紫 (code): rgba(99, 102, 241, 0.1)
```

## 7. 禁用状态

按钮禁用时自动应用 `opacity: 0.5` 和 `cursor: not-allowed`

```tsx
<button disabled={!hasNext} className="btn-gradient-border ...">
```

## 8. 响应式设计

移动端和桌面端差异化:

```tsx
className = 'px-1.5 sm:px-2 py-0.5 sm:py-1 text-2xs sm:text-xs';
```

---

**注意**: 避免使用 Mantine Button 组件，统一使用原生 button/Link + 自定义样式类
