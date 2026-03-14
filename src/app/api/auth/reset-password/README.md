# POST /api/auth/reset-password - 重置密码

**鉴权**：无需登录

## 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 邮箱地址 |
| `code` | string | 是 | 6位验证码（需先通过 send-code 获取，type=2） |
| `newPassword` | string | 是 | 新密码 |

## 密码规则

- 长度：8-14位
- 强度：大写、小写、数字、符号中至少包含三种

## 请求示例

```json
{
  "email": "user@example.com",
  "code": "382716",
  "newPassword": "NewPassword123!"
}
```

## 成功返回

```json
{
  "success": true,
  "message": "密码重置成功"
}
```

## 错误情况

| 状态码 | 说明 |
|--------|------|
| 400 | 验证码错误 / 验证码已过期 / 密码强度不足 |
| 404 | 用户不存在 |
| 500 | 重置失败 |
