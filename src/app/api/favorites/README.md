# 收藏 API

> 路径：`/api/favorites`

**注意**：所有接口需要用户登录

---

## 题目类型

| 值 | 含义 | 对应表 |
|----|------|--------|
| "code" | 代码题 | user_code_progress |
| "bagu" | 八股文 | user_bagu_progress |

---

## GET - 获取收藏列表

### 获取指定类型的收藏

**请求**：`GET /api/favorites?type={type}`

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 否 | 题目类型（code/bagu） |

**鉴权**：需要登录

**返回字段**（指定 type 时）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `ids` | number[] | 收藏的题目ID列表 |

**返回示例**：
```json
{
  "ids": [1, 3, 5]
}
```

---

### 获取所有收藏

**请求**：`GET /api/favorites`

**返回字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `bagu` | number[] | 八股文收藏ID列表 |
| `code` | number[] | 代码题收藏ID列表 |

**返回示例**：
```json
{
  "bagu": [1, 5, 12],
  "code": [2, 7]
}
```

---

## POST - 批量设置收藏

> 全量覆盖某类型的收藏

**请求**：`POST /api/favorites`

**鉴权**：需要登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 题目类型（code/bagu） |
| `ids` | number[] | 是 | 收藏的题目ID列表 |

**请求示例**：
```json
{
  "type": "code",
  "ids": [1, 3, 5]
}
```

**返回示例**：
```json
{
  "success": true
}
```

---

## PATCH - 切换单个题目收藏状态

**请求**：`PATCH /api/favorites`

**鉴权**：需要登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 题目类型（code/bagu） |
| `questionId` | number | 是 | 题目ID |
| `isFavorite` | boolean | 是 | 是否收藏 |

**请求示例**：
```json
{
  "type": "code",
  "questionId": 1,
  "isFavorite": true
}
```

**返回示例**：
```json
{
  "success": true
}
```

---

## 错误响应

| 状态码 | 说明 |
|--------|------|
| 400 | 参数错误 |
| 401 | 未登录 |
| 500 | 数据库错误 |
