# 数据库表结构文档

> 最后更新：2026-02-01

## 概览

| 表名 | 说明 |
|------|------|
| `users` | 用户表 |
| `accounts` | OAuth 账号关联表 |
| `code_categories` | 代码题分类表 |
| `code_questions` | 代码题题目表 |
| `bagu_categories` | 八股文分类表 |
| `bagu_questions` | 八股文题目表 |
| `user_code_progress` | 用户代码题进度表 |
| `user_bagu_progress` | 用户八股文进度表 |
| `user_answers` | 用户代码答案表 |
| `user_notes` | 用户笔记表（暂未使用） |
| `email_verification_codes` | 邮箱验证码表 |
| `user_analytics` | 用户行为分析表 |

---

## 用户相关

### users - 用户表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT | PK, AUTO_INCREMENT | 用户ID |
| `username` | VARCHAR(50) | NOT NULL | 用户名（最大20字符，前端限制） |
| `email` | VARCHAR(100) | INDEX | 邮箱（可为空，OAuth用户可能无邮箱） |
| `avatar` | VARCHAR(500) | - | 头像URL |
| `password_hash` | VARCHAR(255) | - | 密码哈希（OAuth用户为空） |
| `status` | TINYINT | DEFAULT 0 | 状态：0=正常，1=已注销 |
| `created_at` | TIMESTAMP | DEFAULT NOW | 创建时间 |
| `updated_at` | TIMESTAMP | ON UPDATE | 更新时间 |

### accounts - OAuth 账号关联表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT | PK, AUTO_INCREMENT | 记录ID |
| `user_id` | INT | FK → users.id | 关联用户ID |
| `type` | VARCHAR(50) | NOT NULL | 账号类型（oauth） |
| `provider` | VARCHAR(50) | NOT NULL, UNIQUE* | 提供商（github/google） |
| `provider_account_id` | VARCHAR(255) | NOT NULL, UNIQUE* | 提供商账号ID |
| `access_token` | TEXT | - | 访问令牌 |
| `refresh_token` | TEXT | - | 刷新令牌 |
| `expires_at` | INT | - | 令牌过期时间戳 |
| `token_type` | VARCHAR(50) | - | 令牌类型 |
| `scope` | VARCHAR(255) | - | 授权范围 |
| `id_token` | TEXT | - | ID令牌（NextAuth标准字段） |
| `session_state` | VARCHAR(255) | - | 会话状态（NextAuth标准字段） |
| `deactivated_user_ids` | JSON | - | 历史失效的user_id数组 |
| `created_at` | TIMESTAMP | DEFAULT NOW | 创建时间 |
| `updated_at` | TIMESTAMP | ON UPDATE | 更新时间 |

**唯一约束**：`UNIQUE (provider, provider_account_id)`

---

## 题目相关

### code_categories - 代码题分类表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | TINYINT | PK | 分类ID |
| `name` | VARCHAR(50) | NOT NULL | 分类名称 |
| `sort_order` | TINYINT | DEFAULT 0 | 排序 |
| `created_at` | TIMESTAMP | DEFAULT NOW | 创建时间 |

**预设分类**：
| ID | 名称 |
|----|------|
| 1 | JS代码分析题 |
| 2 | JS手写题 |
| 3 | TS类型题 |
| 4 | React代码题 |
| 5 | HTML和CSS |
| 6 | 算法题 |

### code_questions - 代码题题目表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT | PK | 题目ID |
| `slug` | VARCHAR(100) | UNIQUE | URL标识 |
| `title` | VARCHAR(200) | NOT NULL | 题目标题 |
| `category_ids` | JSON | - | 分类ID数组，如 [1, 2] |
| `difficulty` | TINYINT | DEFAULT 1 | 难度：1=简单, 2=中等, 3=困难 |
| `description` | TEXT | - | 题目描述 |
| `template` | TEXT | - | 代码模板 |
| `solution` | TEXT | - | 参考答案（Markdown） |
| `test_cases` | JSON | - | 测试用例数组 |
| `follow_up` | JSON | - | 进阶问题数组 |
| `sort_order` | INT | DEFAULT 0 | 排序 |
| `created_at` | TIMESTAMP | DEFAULT NOW | 创建时间 |
| `updated_at` | TIMESTAMP | ON UPDATE | 更新时间 |

**test_cases 格式**：
```json
[
  { "input": "输入描述", "expected": "预期输出", "description": "用例说明" }
]
```

### bagu_categories - 八股文分类表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | TINYINT | PK | 分类ID |
| `slug` | VARCHAR(50) | UNIQUE | URL标识 |
| `name` | VARCHAR(50) | NOT NULL | 分类名称 |
| `sort_order` | INT | DEFAULT 0 | 排序 |
| `created_at` | TIMESTAMP | DEFAULT NOW | 创建时间 |

### bagu_questions - 八股文题目表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT | PK | 题目ID |
| `slug` | VARCHAR(100) | UNIQUE | URL标识 |
| `category_id` | TINYINT | FK → bagu_categories.id | 所属分类ID |
| `title` | VARCHAR(200) | NOT NULL | 题目标题 |
| `content` | TEXT | - | 答案内容（Markdown） |
| `has_answer` | TINYINT | DEFAULT 0 | 是否有答案：0=无, 1=有 |
| `sort_order` | INT | DEFAULT 0 | 排序 |
| `created_at` | TIMESTAMP | DEFAULT NOW | 创建时间 |
| `updated_at` | TIMESTAMP | ON UPDATE | 更新时间 |

---

## 用户进度相关

### user_code_progress - 用户代码题进度表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `user_id` | INT | PK* | 用户ID |
| `question_id` | INT | PK* | 题目ID |
| `status` | TINYINT | DEFAULT 0 | 状态：0=未开始, 1=尝试中, 2=已完成 |
| `is_favorite` | TINYINT | DEFAULT 0 | 收藏：0=未收藏, 1=已收藏 |
| `created_at` | TIMESTAMP | DEFAULT NOW | 创建时间 |
| `updated_at` | TIMESTAMP | ON UPDATE | 更新时间 |

**主键**：`PRIMARY KEY (user_id, question_id)`
**索引**：`INDEX idx_favorite (user_id, is_favorite)`

### user_bagu_progress - 用户八股文进度表

结构与 `user_code_progress` 完全相同。

### user_answers - 用户代码答案表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT | PK, AUTO_INCREMENT | 记录ID |
| `user_id` | INT | FK → users.id | 用户ID |
| `question_id` | INT | NOT NULL | 题目ID |
| `code` | TEXT | NOT NULL | 用户提交的代码（最大约65KB） |
| `created_at` | TIMESTAMP | DEFAULT NOW | 创建时间 |
| `updated_at` | TIMESTAMP | ON UPDATE | 更新时间 |

**唯一约束**：`UNIQUE (user_id, question_id)`

### user_notes - 用户笔记表（暂未使用）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT | PK, AUTO_INCREMENT | 记录ID |
| `user_id` | INT | FK → users.id | 用户ID |
| `question_id` | INT | NOT NULL | 题目ID |
| `category_tag` | INT | NOT NULL | 分类标签 |
| `content` | TEXT | NOT NULL | 笔记内容（Markdown） |
| `created_at` | TIMESTAMP | DEFAULT NOW | 创建时间 |
| `updated_at` | TIMESTAMP | ON UPDATE | 更新时间 |

**唯一约束**：`UNIQUE (user_id, question_id, category_tag)`

### email_verification_codes - 邮箱验证码表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT | PK, AUTO_INCREMENT | 记录ID |
| `email` | VARCHAR(100) | NOT NULL, INDEX | 邮箱地址 |
| `code` | VARCHAR(6) | NOT NULL | 6位数字验证码 |
| `type` | TINYINT | NOT NULL, DEFAULT 1 | 类型：1=登录/注册, 2=重置密码 |
| `ip` | VARCHAR(45) | INDEX | 发送请求的IP地址 |
| `expires_at` | TIMESTAMP | NOT NULL | 过期时间（5分钟后） |
| `used` | TINYINT | DEFAULT 0 | 状态：0=未使用, 1=已使用 |
| `verify_attempts` | TINYINT | DEFAULT 0 | 验证尝试次数 |
| `locked_until` | TIMESTAMP | NULL | 锁定截止时间 |
| `created_at` | TIMESTAMP | DEFAULT NOW, INDEX | 创建时间 |

**索引**：
- `INDEX idx_email_type (email, type)`
- `INDEX idx_ip (ip)`
- `INDEX idx_created (created_at)`

**安全限制**：
| 规则 | 说明 |
|------|------|
| 同邮箱60秒限制 | 同一邮箱60秒内只能发送1次 |
| 同邮箱10分钟限制 | 同一邮箱10分钟内最多发送3次 |
| 同IP小时限制 | 同一IP每小时最多发送10次 |
| 验证错误锁定 | 连续错误5次，锁定30分钟 |
| 验证码过期 | 5分钟有效期 |

---

## 分析相关

### user_analytics - 用户行为分析表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 记录ID |
| `user_id` | INT | INDEX | 用户ID（未登录为NULL） |
| `event` | VARCHAR(50) | NOT NULL, INDEX | 事件名称 |
| `data` | JSON | - | 事件数据 |
| `url` | VARCHAR(255) | - | 页面URL |
| `created_at` | TIMESTAMP | DEFAULT NOW, INDEX | 创建时间 |

**事件类型**：
| 事件 | 说明 | data 字段 |
|------|------|----------|
| `page_view` | 页面浏览 | `{ page: string }` |
| `question_view` | 查看题目 | `{ questionId, questionTitle, type }` |
| `question_solved` | 完成题目 | `{ questionId, questionTitle, type }` |
| `code_save` | 保存代码 | `{ questionId }` |
| `favorite_add` | 添加收藏 | `{ questionId, type }` |
| `favorite_remove` | 取消收藏 | `{ questionId, type }` |

---

## ER 关系图

```
users (1) ──────< accounts (N)
  │
  │ (1)
  │
  ├──────< user_code_progress (N)
  │
  ├──────< user_bagu_progress (N)
  │
  ├──────< user_answers (N)
  │
  ├──────< user_notes (N)
  │
  └──────< user_analytics (N)

code_categories (1) ────── code_questions (N) [通过 JSON category_ids 关联]

bagu_categories (1) ──────< bagu_questions (N)
```
