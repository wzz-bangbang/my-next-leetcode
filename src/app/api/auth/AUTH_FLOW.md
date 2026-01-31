# NextAuth.js 登录流程说明

## 登录时调用的接口

### 1. `GET /api/auth/providers`
**作用**：获取可用的登录方式列表

返回 `auth.ts` 中配置的所有 providers（GitHub、Credentials 等）。

```json
{
  "github": { "id": "github", "name": "GitHub", "type": "oauth" },
  "credentials": { "id": "credentials", "name": "credentials", "type": "credentials" }
}
```

> ⚠️ 这是 NextAuth.js 内部自动调用的，前端代码没有直接使用。主要用于默认登录页面，我们用自定义弹窗所以实际不需要，但无法禁用。

---

### 2. `GET /api/auth/csrf`
**作用**：获取 CSRF Token（防跨站请求伪造）

返回一次性 token，后续登录请求必须携带，防止恶意网站伪造登录请求。

```json
{ "csrfToken": "abc123..." }
```

---

### 3. `POST /api/auth/callback/credentials`
**作用**：实际执行登录验证（核心接口）

执行流程：
1. 验证 CSRF token
2. 调用 `authorize()` 函数验证邮箱密码
3. 检查用户状态（是否已注销）
4. 验证通过后生成 JWT token
5. 设置 HTTP-only Cookie（`next-auth.session-token`）

请求体：
```json
{
  "csrfToken": "xxx",
  "email": "user@example.com",
  "password": "xxx"
}
```

---

### 4. `GET /api/auth/session`
**作用**：获取当前登录状态

读取 Cookie 中的 JWT，解析并返回用户信息。前端的 `useSession()` hook 调用此接口。

```json
{
  "user": { "name": "xxx", "email": "xxx@xx.com", "id": "123" },
  "expires": "2026-03-02T..."
}
```

---

## 完整流程图

```
用户点击登录
    ↓
① GET /api/auth/providers    → 获取登录方式（NextAuth 内部调用，可忽略）
    ↓
② GET /api/auth/csrf         → 获取 CSRF Token
    ↓
③ POST /api/auth/callback/credentials  → 发送邮箱+密码+csrfToken
    ↓                                      ↓
    ↓                              调用 authorize() 验证
    ↓                                      ↓
    ↓                              验证通过 → 设置 Cookie
    ↓
④ GET /api/auth/session      → 获取用户信息，更新前端状态
```

---

## 相关文件

- `src/lib/auth.ts` - NextAuth 配置，包含 providers 和 callbacks
- `src/components/LoginButton.tsx` - 登录弹窗组件
- `src/app/api/auth/[...nextauth]/route.ts` - API 路由入口
- `src/app/api/auth/register/route.ts` - 注册接口
- `src/app/api/auth/deactivate/route.ts` - 注销账号接口
