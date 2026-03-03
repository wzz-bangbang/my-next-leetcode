# ========== 构建阶段 ==========
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖（利用缓存）
COPY package.json package-lock.json* ./
RUN npm ci --registry=https://registry.npmmirror.com

# 复制源代码
COPY . .

# 设置构建时环境变量（Sentry Source Maps 上传需要）
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT

# 构建
ENV NODE_ENV=production
RUN npm run build

# ========== 运行阶段 ==========
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 创建非 root 用户（安全最佳实践）
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制 standalone 输出
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# 设置文件权限
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
