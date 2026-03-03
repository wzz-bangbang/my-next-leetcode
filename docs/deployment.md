# 部署指南

## 部署方式

本项目支持 Docker 容器化部署，包含以下组件：
- **web**: Next.js 应用（SSR）
- **db**: MySQL 8.0 数据库
- **nginx**: 反向代理（HTTPS）

---

## 快速开始

### 1. 准备服务器

- 操作系统：Ubuntu 20.04+ / CentOS 7+
- 配置建议：2 核 4G 内存
- 安装 Docker 和 Docker Compose

```bash
# Ubuntu
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 配置环境变量

```bash
# 复制示例配置
cp docs/env.production.example .env.production

# 编辑配置
vim .env.production
```

**必须修改的配置**：
- `DATABASE_PASSWORD`: 数据库密码
- `NEXTAUTH_URL`: 你的域名
- `NEXTAUTH_SECRET`: 运行 `openssl rand -base64 32` 生成
- `RESEND_API_KEY`: Resend API 密钥
- `EMAIL_FROM`: 验证域名后的发件地址

### 3. SSL 证书

#### 方式 A：Let's Encrypt（免费）

```bash
# 安装 certbot
sudo apt install certbot

# 生成证书（替换 your-domain.com）
sudo certbot certonly --standalone -d your-domain.com

# 复制证书到项目目录
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/nginx/ssl/
sudo chown -R $USER:$USER docker/nginx/ssl/
```

#### 方式 B：自签名证书（测试用）

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/privkey.pem \
  -out docker/nginx/ssl/fullchain.pem \
  -subj "/CN=localhost"
```

### 4. 构建和启动

```bash
# 构建并启动所有服务
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps
```

### 5. 验证部署

```bash
# 检查服务健康状态
curl -I https://your-domain.com

# 检查数据库连接
docker exec leetcode-mysql mysql -u leetcode -p -e "SHOW DATABASES;"
```

---

## 常用命令

```bash
# 停止服务
docker-compose -f docker-compose.prod.yml down

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 查看 Web 日志
docker logs -f leetcode-web

# 查看 MySQL 日志
docker logs -f leetcode-mysql

# 进入 Web 容器
docker exec -it leetcode-web sh

# 进入 MySQL 容器
docker exec -it leetcode-mysql mysql -u root -p
```

---

## 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

---

## 数据备份

```bash
# 备份数据库
docker exec leetcode-mysql mysqldump -u root -p leetcode > backup_$(date +%Y%m%d).sql

# 恢复数据库
cat backup_20240101.sql | docker exec -i leetcode-mysql mysql -u root -p leetcode
```

---

## 故障排查

### Web 服务无法启动

```bash
# 查看详细日志
docker logs leetcode-web

# 常见原因：
# 1. 环境变量未配置
# 2. 数据库连接失败
# 3. 端口被占用
```

### 数据库连接失败

```bash
# 检查数据库是否启动
docker exec leetcode-mysql mysqladmin -u root -p ping

# 检查网络连通性
docker exec leetcode-web ping db
```

### SSL 证书问题

```bash
# 检查证书是否存在
ls -la docker/nginx/ssl/

# 检查证书有效期
openssl x509 -in docker/nginx/ssl/fullchain.pem -noout -dates
```

---

## 性能优化

### 数据库优化

编辑 `docker/mysql/my.cnf`：

```ini
[mysqld]
# 连接数
max_connections = 200

# 缓冲池大小（建议为可用内存的 70%）
innodb_buffer_pool_size = 1G

# 查询缓存
query_cache_type = 1
query_cache_size = 64M
```

### Nginx 优化

已在 `docker/nginx/nginx.conf` 中配置：
- Gzip 压缩
- 静态资源长缓存
- Keep-Alive 连接复用

---

## 监控

### Sentry 错误监控

已集成，配置 `NEXT_PUBLIC_SENTRY_DSN` 环境变量即可。

### 日志聚合（可选）

可接入 ELK 或云服务商的日志服务：
- 阿里云 SLS
- 腾讯云 CLS
- AWS CloudWatch
