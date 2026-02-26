# POST /api/auth/deactivate - 注销账号

**鉴权**：需要登录

## 请求参数

无

## 成功返回

```json
{
  "success": true,
  "message": "账号已注销"
}
```

## 错误情况

| 状态码 | 说明 |
|--------|------|
| 401 | 未登录 |
| 404 | 用户不存在 |
| 500 | 注销失败 |

## 注销逻辑

1. 将 `users.status` 设为 1（已注销）
2. 保留 `accounts` 记录用于历史追溯
3. 注销后再次用相同 OAuth 登录会创建新用户，旧 user_id 存入 `accounts.deactivated_user_ids`
