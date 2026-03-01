# 环境变量配置说明

创建 `.env.local` 文件并配置以下环境变量：

## 数据库配置

```bash
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=leetcode
```

## NextAuth 配置

```bash
# 生产环境必须设置为你的正式域名
NEXTAUTH_URL=http://localhost:3000

# 随机生成的密钥，可用 `openssl rand -base64 32` 生成
NEXTAUTH_SECRET=your_nextauth_secret_here
```

## OAuth 配置

### GitHub

1. 访问 https://github.com/settings/developers
2. 创建 OAuth App
3. Homepage URL: `http://localhost:3000`（生产环境用正式域名）
4. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Google

1. 访问 https://console.cloud.google.com/apis/credentials
2. 创建 OAuth 2.0 客户端 ID
3. 添加授权的 JavaScript 来源和重定向 URI

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 邮件服务（Resend）

1. 访问 https://resend.com/api-keys
2. 创建 API Key

```bash
RESEND_API_KEY=re_your_resend_api_key
```

## Sentry 错误监控（可选）

1. 注册 https://sentry.io
2. 创建 Next.js 项目
3. 复制 DSN

```bash
# 在 Sentry 控制台创建项目后获取 DSN
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Sentry 组织和项目名称（用于上传 Source Maps）
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project

# Sentry Auth Token（用于上传 Source Maps）
# 在 https://sentry.io/settings/auth-tokens/ 创建
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

## 生产环境清单

| 变量 | 是否必须 | 说明 |
|-----|---------|------|
| DATABASE_* | ✅ | 数据库连接 |
| NEXTAUTH_URL | ✅ | 改为正式域名 |
| NEXTAUTH_SECRET | ✅ | 生成强密钥 |
| GITHUB_* | ⚠️ | 如需 GitHub 登录 |
| GOOGLE_* | ⚠️ | 如需 Google 登录 |
| RESEND_API_KEY | ✅ | 邮件验证码 |
| SENTRY_* | ⚠️ | 错误监控（推荐） |
