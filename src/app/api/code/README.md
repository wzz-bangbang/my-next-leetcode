# 代码题 API

> 路径：`/api/code`

## GET - 获取代码题数据

### 获取题目列表

**请求**：`GET /api/code`

**鉴权**：无需登录

**返回字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 题目ID |
| `slug` | string | URL标识 |
| `title` | string | 题目标题 |
| `tags` | number[] | 分类ID数组 |
| `difficulty` | number | 难度：1=简单, 2=中等, 3=困难 |

**返回示例**：
```json
[
  {
    "id": 1,
    "slug": "promise-all",
    "title": "实现 Promise.all",
    "tags": [2],
    "difficulty": 2
  }
]
```

---

### 获取题目详情

**请求**：`GET /api/code?id={questionId}`

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
| `title` | string | 题目标题 |
| `tags` | number[] | 分类ID数组 |
| `difficulty` | number | 难度 |
| `description` | string \| null | 题目描述 |
| `template` | string \| null | 代码模板 |
| `solution` | string \| null | 参考答案（Markdown） |
| `testCases` | TestCase[] \| null | 测试用例 |
| `followUp` | string[] \| null | 进阶问题 |
| `isFavorited` | boolean | 是否已收藏（未登录为 false） |
| `userStatus` | number | 用户状态：0=未开始, 1=尝试中, 2=已完成 |
| `savedCode` | string \| null | 用户保存的代码 |

**TestCase 结构**：
```typescript
interface TestCase {
  input: string;        // 输入描述
  expected: string;     // 预期输出
  description?: string; // 用例说明
}
```

**返回示例**：
```json
{
  "id": 1,
  "slug": "promise-all",
  "title": "实现 Promise.all",
  "tags": [2],
  "difficulty": 2,
  "description": "请实现一个 Promise.all 函数...",
  "template": "function promiseAll(promises) {\n  // 实现代码\n}",
  "solution": "## 思路\n...",
  "testCases": [
    { "input": "[Promise.resolve(1)]", "expected": "[1]" }
  ],
  "followUp": ["如何处理并发限制？"],
  "isFavorited": true,
  "userStatus": 2,
  "savedCode": "function promiseAll(promises) { ... }"
}
```

---

## 错误响应

| 状态码 | 说明 |
|--------|------|
| 404 | 题目不存在 |
| 500 | 数据库错误 |
