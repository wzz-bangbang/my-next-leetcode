# 题目状态 API

> 路径：`/api/question-status`

**注意**：所有接口需要用户登录

---

## 状态枚举

| 值 | 含义 |
|----|------|
| 0 | 未开始 |
| 1 | 尝试中 |
| 2 | 已完成 |

## 题目类型

| 值 | 含义 | 对应表 |
|----|------|--------|
| 1 / "code" | 代码题 | user_code_progress |
| 2 / "bagu" | 八股文 | user_bagu_progress |

---

## GET - 获取题目状态

### 获取所有题目状态

**请求**：`GET /api/question-status?type={type}`

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 否 | 题目类型，默认 "1"（code） |

**鉴权**：需要登录

**返回字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `statusMap` | Record<string, number> | 题目ID → 状态值的映射（只返回状态 > 0 的） |

**返回示例**：
```json
{
  "statusMap": {
    "1": 2,
    "3": 1,
    "5": 2
  }
}
```

---

### 获取单个题目状态

**请求**：`GET /api/question-status?questionId={id}&type={type}`

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `questionId` | string | 是 | 题目ID |
| `type` | string | 否 | 题目类型，默认 "1" |

**返回字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | number | 状态值（0/1/2） |

**返回示例**：
```json
{
  "status": 2
}
```

---

## POST - 更新单个题目状态

**请求**：`POST /api/question-status`

**鉴权**：需要登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `questionId` | number | 是 | 题目ID |
| `questionType` | number | 否 | 题目类型，默认 1 |
| `status` | number | 是 | 新状态值 |

**请求示例**：
```json
{
  "questionId": 1,
  "questionType": 1,
  "status": 2
}
```

**返回示例**：
```json
{
  "success": true
}
```

---

## PUT - 批量导入状态

> 用于迁移 localStorage 数据

**请求**：`PUT /api/question-status`

**鉴权**：需要登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `statusList` | StatusItem[] | 是 | 状态列表 |
| `questionType` | number | 否 | 题目类型，默认 1 |

**StatusItem 结构**：
```typescript
interface StatusItem {
  questionId: number;
  status: number;
}
```

**请求示例**：
```json
{
  "statusList": [
    { "questionId": 1, "status": 2 },
    { "questionId": 3, "status": 1 }
  ],
  "questionType": 1
}
```

**返回示例**：
```json
{
  "success": true,
  "count": 2
}
```

---

## 错误响应

| 状态码 | 说明 |
|--------|------|
| 400 | 参数错误 |
| 401 | 未登录 |
| 500 | 数据库错误 |
