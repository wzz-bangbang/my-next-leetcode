import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // 生产环境使用 standalone 输出模式（用于 Docker 部署）
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
};

// Sentry 配置选项
const sentryWebpackPluginOptions = {
  // 组织和项目名称（在 Sentry 控制台创建项目后获取）
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 上传 Source Maps 的认证 Token
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // 静默模式（不打印详细日志）
  silent: true,

  // 隐藏 Source Maps（不暴露给客户端）
  hideSourceMaps: true,

  // 禁用自动检测 Vercel 环境
  disableServerWebpackPlugin: false,
  disableClientWebpackPlugin: false,

  // 自动上传 Source Maps
  widenClientFileUpload: true,

  // 自动检测 release 版本
  automaticVercelMonitors: false,
};

// 始终启用 withSentryConfig，让 Sentry SDK 被正确加载
// Sentry 会根据 DSN 是否配置决定是否发送数据
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
