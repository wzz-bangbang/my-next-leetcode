# POST /api/auth/verify-email - 验证当前邮箱

**鉴权**：需要登录

## 用途

换绑邮箱的第一步：验证用户当前邮箱的所有权。

## 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 当前登录用户的邮箱（必须与 session 中的邮箱一致） |
| `code` | string | 是 | 6位验证码（通过 send-code 获取，type=1） |

## 请求示例

```json
{
  "email": "current@example.com",
  "code": "382716"
}
```

## 成功返回

```json
{
  "message": "验证成功"
}
```

## 错误情况

| 状态码 | 说明 |
|--------|------|
| 400 | 邮箱不匹配 / 验证码无效或已过期 |
| 401 | 未登录 |
| 429 | 尝试次数过多，请30分钟后再试 |
| 500 | 服务器错误 |

## 换绑邮箱完整流程

```
1. send-code (email=旧邮箱, type=1) → 获取旧邮箱验证码
2. verify-email (email=旧邮箱, code=xxx) → 验证旧邮箱 ← 本接口
3. send-code (email=新邮箱, type=3) → 获取新邮箱验证码
4. change-email (newEmail=新邮箱, code=xxx) → 完成换绑
```
