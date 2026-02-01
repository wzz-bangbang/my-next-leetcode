# 八股文 API

> 路径：`/api/bagu`

## GET - 获取八股文数据

### 获取分类和题目列表

**请求**：`GET /api/bagu`

**鉴权**：无需登录

**返回字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `categories` | Category[] | 分类列表 |

**Category 结构**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 分类ID |
| `slug` | string | URL标识 |
| `name` | string | 分类名称 |
| `questions` | Question[] | 题目列表 |

**Question 结构**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 题目ID |
| `slug` | string | URL标识 |
| `title` | string | 题目标题 |
| `hasAnswer` | boolean | 是否有答案 |

**返回示例**：
```json
{
  "categories": [
    {
      "id": 1,
      "slug": "javascript",
      "name": "JavaScript基础",
      "questions": [
        {
          "id": 1,
          "slug": "var-let-const",
          "title": "var、let、const 的区别",
          "hasAnswer": true
        }
      ]
    }
  ]
}
```

---

### 获取题目详情

**请求**：`GET /api/bagu?id={questionId}`

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 题目ID 或 slug |

**鉴权**：无需登录（登录后可获取用户进度）

**返回字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 题目ID |
| `slug` | string | URL标识 |
| `categoryId` | number | 所属分类ID |
| `title` | string | 题目标题 |
| `content` | string \| null | 答案内容（Markdown） |
| `hasAnswer` | boolean | 是否有答案 |
| `isFavorited` | boolean | 是否已收藏（未登录为 false） |
| `userStatus` | number | 用户状态：0=未开始, 1=尝试中, 2=已完成 |

**返回示例**：
```json
{
  "id": 1,
  "slug": "var-let-const",
  "categoryId": 1,
  "title": "var、let、const 的区别",
  "content": "## 区别\n\n1. **作用域**...",
  "hasAnswer": true,
  "isFavorited": false,
  "userStatus": 0
}
```

---

## 错误响应

| 状态码 | 说明 |
|--------|------|
| 404 | 题目不存在 |
| 500 | 数据库错误 |
