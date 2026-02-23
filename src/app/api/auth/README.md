# 认证 API

> 路径前缀：`/api/auth`

---

## NextAuth 内置接口

以下接口由 NextAuth.js 自动处理：

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/auth/signin` | GET | 登录页面 |
| `/api/auth/signout` | POST | 登出 |
| `/api/auth/session` | GET | 获取当前会话 |
| `/api/auth/csrf` | GET | 获取 CSRF token |
| `/api/auth/providers` | GET | 获取可用登录方式 |
| `/api/auth/callback/github` | GET | GitHub OAuth 回调 |
| `/api/auth/callback/google` | GET | Google OAuth 回调 |
| `/api/auth/callback/credentials` | POST | 邮箱密码登录回调 |

---

## POST /api/auth/send-code - 发送验证码

**请求**：`POST /api/auth/send-code`

**鉴权**：无需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 邮箱地址 |
| `type` | number | 否 | 验证码类型：1=登录/注册（默认），2=重置密码 |

**请求示例**：
```json
{
  "email": "user@example.com",
  "type": 1
}
```

**成功返回**：
```json
{
  "success": true,
  "message": "验证码已发送"
}
```

**错误情况**：
| 状态码 | 说明 |
|--------|------|
| 400 | 邮箱格式错误 / 无效的验证码类型 / 该邮箱未注册（type=2 时） |
| 429 | 发送频率限制（见下方安全限制） |
| 500 | 发送失败 |

**安全限制**：
| 规则 | 限制 |
|------|------|
| 同邮箱60秒 | 60秒内只能发送1次 |
| 同邮箱10分钟 | 10分钟内最多3次 |
| 同IP每小时 | 每小时最多10次 |
| 验证错误锁定 | 连续错误5次，锁定30分钟 |

---

## POST /api/auth/login-with-code - 验证码登录

**请求**：`POST /api/auth/login-with-code`

**鉴权**：无需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 邮箱地址 |
| `code` | string | 是 | 6位验证码 |

**请求示例**：
```json
{
  "email": "user@example.com",
  "code": "382716"
}
```

**成功返回**：
```json
{
  "success": true,
  "isNewUser": false,
  "user": {
    "id": 1,
    "name": "user",
    "email": "user@example.com",
    "image": null
  }
}
```

**说明**：
- 如果邮箱不存在，会自动注册新用户（`isNewUser: true`）
- 登录成功后会自动设置 session cookie

**错误情况**：
| 状态码 | 说明 |
|--------|------|
| 400 | 验证码错误（提示剩余尝试次数）/ 验证码已过期 / 邮箱格式错误 |
| 429 | 连续错误5次，锁定30分钟 |
| 500 | 登录失败 |

---

## POST /api/auth/reset-password - 重置密码

**请求**：`POST /api/auth/reset-password`

**鉴权**：无需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 邮箱地址 |
| `code` | string | 是 | 6位验证码（需先通过 send-code 获取，type=2） |
| `newPassword` | string | 是 | 新密码（8-14位，需包含大写+小写+数字+符号中的至少三种） |

**请求示例**：
```json
{
  "email": "user@example.com",
  "code": "382716",
  "newPassword": "NewPassword123!"
}
```

**成功返回**：
```json
{
  "success": true,
  "message": "密码重置成功"
}
```

**错误情况**：
| 状态码 | 说明 |
|--------|------|
| 400 | 验证码错误（提示剩余尝试次数）/ 验证码已过期 / 密码强度不足 |
| 404 | 用户不存在 |
| 429 | 连续错误5次，锁定30分钟 |
| 500 | 重置失败 |

---

## POST /api/auth/register - 用户注册

**请求**：`POST /api/auth/register`

**鉴权**：无需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 邮箱地址 |
| `password` | string | 是 | 密码（8-14位，需包含大写、小写、数字、符号中的至少三种） |
| `name` | string | 否 | 用户名（最大20字符） |

**请求示例**：
```json
{
  "email": "user@example.com",
  "password": "MyPassword123!",
  "name": "张三"
}
```

**成功返回**：
```json
{
  "success": true,
  "message": "注册成功"
}
```

**错误返回**：
```json
{
  "error": "该邮箱已注册"
}
```

### 验证规则

| 字段 | 规则 |
|------|------|
| email | 必填，有效邮箱格式 |
| password | 8-14位，包含大写+小写+数字+符号中的至少三种 |
| name | 可选，最大20字符 |

---

## POST /api/auth/deactivate - 注销账号

**请求**：`POST /api/auth/deactivate`

**鉴权**：需要登录

**请求体**：无

**成功返回**：
```json
{
  "success": true,
  "message": "账号已注销"
}
```

### 注销逻辑

1. 将 `users.status` 设为 1（已注销）
2. 保留 `accounts` 记录用于历史追溯
3. 注销后再次用相同 OAuth 登录会创建新用户，旧 user_id 存入 `accounts.deactivated_user_ids`

---

## 错误响应

| 状态码 | 说明 |
|--------|------|
| 400 | 参数错误 |
| 401 | 未登录（deactivate） |
| 404 | 用户不存在 |
| 500 | 服务器错误 |

---

## 登录方式

### 1. GitHub OAuth

点击 GitHub 登录按钮 → 跳转 GitHub 授权 → 回调创建/关联用户

### 2. Google OAuth

点击 Google 登录按钮 → 跳转 Google 授权 → 回调创建/关联用户

### 3. 邮箱密码

1. 先调用 `/api/auth/register` 注册
2. 再通过 NextAuth 的 credentials provider 登录

---

## Session 数据

登录后可通过 `useSession()` 或 `auth()` 获取：

```typescript
interface Session {
  user: {
    id: string;    // 用户ID（数据库中的 users.id）
    name: string;  // 用户名
    email: string; // 邮箱
    image: string; // 头像URL
  };
  expires: string; // 过期时间
}
```
