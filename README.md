# 前端练习平台

基于 Next.js 15 构建的前端面试题练习平台，支持代码题和八股文练习。

## 技术栈

- **框架**: Next.js 15 (App Router, SSR)
- **UI**: Mantine + TailwindCSS
- **数据库**: MySQL 8.0
- **认证**: NextAuth.js (GitHub/Google OAuth + 邮箱登录)
- **邮件**: Resend
- **监控**: Sentry

## 功能特性

- ✅ 代码题练习（JS/TS/React）
- ✅ 八股文练习
- ✅ 多种登录方式（GitHub/Google/邮箱验证码）
- ✅ 用户进度追踪
- ✅ 收藏功能
- ✅ 代码编辑器（Monaco Editor）

## 快速开始

### 1. 安装依赖

```bash
npm install --registry=https://registry.npmmirror.com
```

### 2. 启动数据库

```bash
cd docker && docker-compose up -d
```

### 3. 配置环境变量

```bash
cp docs/env.production.example .env.local
# 编辑 .env.local 填写配置
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 部署

详见 [docs/deployment.md](./docs/deployment.md)

### 快速部署（Docker）

```bash
# 配置环境变量
cp docs/env.production.example .env.production
vim .env.production

# 构建并启动
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## 文档

| 文档 | 说明 |
|-----|------|
| [环境变量配置](./docs/env-config.md) | 开发/生产环境变量说明 |
| [部署指南](./docs/deployment.md) | Docker 部署详细步骤 |
| [数据库结构](./scripts/database-schema.md) | 表结构和字段说明 |
| [测试用例](./tests/README.md) | 黑盒测试用例 |

## 目录结构

```
├── src/
│   ├── app/              # Next.js App Router 页面
│   ├── components/       # React 组件
│   ├── lib/              # 工具函数
│   ├── services/         # 前端 API 服务
│   └── types/            # TypeScript 类型
├── docker/               # Docker 配置
├── docs/                 # 文档
├── scripts/              # 脚本和 SQL
└── tests/                # 测试用例
```

## 后续优化方向

- [ ] SSR 性能优化
- [ ] 增加标签 & 进阶思考 & 关联题目（知识图谱）
- [ ] 邮件服务增加多服务切换
- [ ] Web Worker 缓存离线数据
- [ ] 爬虫取最新各大平台的数据并解析题目
- [ ] 增加 AI 解题和 AI 练习入口
- [ ] 增加水平判断，15k 25k 类似这种标准
- [ ] 增加用户维护入口
- [ ] 自动生成头像昵称
- [ ] 换昵称 换头像

上线后cookie字段名可以改一下,  改成和域名相关的