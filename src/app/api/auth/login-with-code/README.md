# POST /api/auth/login-with-code - 验证码登录

**鉴权**：无需登录

## 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 邮箱地址 |
| `code` | string | 是 | 6位验证码 |

## 请求示例

```json
{
  "email": "user@example.com",
  "code": "382716"
}
```

## 成功返回

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

## 说明

- 如果邮箱不存在，会自动注册新用户（`isNewUser: true`）
- 登录成功后自动设置 session cookie

## 错误情况

| 状态码 | 说明 |
|--------|------|
| 400 | 验证码错误 / 验证码已过期 / 邮箱格式错误 |
| 429 | 连续错误5次，锁定30分钟 |
| 500 | 登录失败 |
