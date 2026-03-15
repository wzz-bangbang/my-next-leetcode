/**
 * Mantine UI 主题配置
 */
import { createTheme, MantineColorsTuple } from '@mantine/core';

// 自定义紫色调色板（主色调）
const purple: MantineColorsTuple = [
  '#faf5ff', // 0 - lightest
  '#f3e8ff',
  '#e9d5ff',
  '#d8b4fe',
  '#c084fc',
  '#a855f7', // 5 - primary
  '#9333ea',
  '#7e22ce',
  '#6b21a8',
  '#581c87', // 9 - darkest
];

// 自定义蓝紫色调色板
const indigo: MantineColorsTuple = [
  '#eef2ff',
  '#e0e7ff',
  '#c7d2fe',
  '#a5b4fc',
  '#818cf8',
  '#6366f1', // 5 - primary
  '#4f46e5',
  '#4338ca',
  '#3730a3',
  '#312e81',
];

export const mantineTheme = createTheme({
  // 主色调
  primaryColor: 'purple',

  // 自定义颜色
  colors: {
    purple,
    indigo,
  },

  // 默认圆角
  defaultRadius: 'md',

  // 组件默认样式
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        root: {
          fontWeight: 500,
        },
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
        centered: true,
      },
    },
    Tooltip: {
      defaultProps: {
        withArrow: true,
      },
    },
    ActionIcon: {
      defaultProps: {
        radius: 'md',
      },
    },
  },

  // 字体
  fontFamily: "'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif",
  fontFamilyMonospace: "'SF Mono', 'Monaco', 'Menlo', monospace",

  // 阴影
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 2px 4px rgba(0, 0, 0, 0.05)',
    md: '0 4px 8px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.1)',
    xl: '0 12px 24px rgba(0, 0, 0, 0.12)',
  },
});
