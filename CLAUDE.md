# Claude Code 项目规则

## 样式规范

### 参考文件

- 按钮样式规范：`src/styles/button-styles.md`
- 主题配置：`src/styles/theme.ts`
- 全局样式：`src/app/globals.css`

### 按钮样式要点

1. 使用 `btn-gradient-border` 类 + 主题色类（如 `btn-gradient-bagu`、`btn-gradient-star`）
2. 圆角统一使用 `rounded-full`
3. 图标尺寸使用 `iconSize` 常量：`import { iconSize } from '@/styles/theme'`
4. 避免使用 Mantine Button 组件，统一使用原生 button/Link + 自定义样式类
5. 选中态背景色使用低透明度（约 0.1）

### 主题色

- primary: 紫蓝渐变（默认/登录按钮）
- bagu: 紫粉渐变（八股题相关）
- code: 蓝紫渐变（代码编辑器相关）
- star: 橙黄渐变（收藏按钮）
- simulation: 粉红渐变（随机模拟）

## npm 配置

- 使用淘宝镜像源：`--registry=https://registry.npmmirror.com`

## 语言

- 回复使用中文
