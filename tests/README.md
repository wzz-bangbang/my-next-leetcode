# 测试用例汇总

> 项目：my-next-leetcode  
> 更新日期：2026-02-27

---

## 目录结构

```
tests/
├── README.md              # 本文件 - 总览
├── auth/                  # 认证模块
│   ├── README.md          # 测试用例
│   └── checklist.md       # 执行记录
├── bagu/                  # 八股题模块
│   ├── README.md
│   └── checklist.md
├── code/                  # 代码题模块
│   ├── README.md
│   └── checklist.md
├── favorites/             # 收藏模块
│   ├── README.md
│   └── checklist.md
├── question-status/       # 题目状态模块
│   ├── README.md
│   └── checklist.md
└── answers/               # 用户答案模块
    ├── README.md
    └── checklist.md
```

---

## 用例统计

| 模块                       | 用例数  | 分类                                               |
| -------------------------- | ------- | -------------------------------------------------- |
| 认证 (auth)                | 48      | 注册、登录、密码、邮箱、注销、OAuth、Session、安全 |
| 八股题 (bagu)              | 20      | 列表、详情、用户进度、页面交互                     |
| 代码题 (code)              | 28      | 列表、详情、用户进度、编辑器、运行、页面交互       |
| 收藏 (favorites)           | 20      | 获取、切换、批量、隔离、前端交互                   |
| 题目状态 (question-status) | 20      | 获取、更新、批量导入、隔离、前端交互               |
| 用户答案 (answers)         | 20      | 获取、保存、长度限制、隔离、前端交互               |
| **总计**                   | **156** |                                                    |

---

## 测试优先级

### P0 - 核心功能（必测）

1. **认证**
   - TC-LOGIN-001 正常登录
   - TC-CODE-001 发送验证码成功
   - TC-CODE-005 验证码登录成功
   - TC-OAUTH-001 GitHub 首次登录

2. **题目浏览**
   - TC-BAGU-LIST-001 正常获取列表
   - TC-CODE-LIST-001 正常获取列表
   - TC-BAGU-DETAIL-001 获取详情
   - TC-CODE-DETAIL-001 获取详情

3. **用户数据**
   - TC-FAV-TOGGLE-001 添加收藏
   - TC-STATUS-UPDATE-001 更新状态
   - TC-ANS-SAVE-001 保存代码

### P1 - 重要功能

- 验证码频率限制
- 密码强度校验
- 代码长度限制
- 用户数据隔离

### P2 - 一般功能

- 边界值测试
- 错误提示
- UI 交互细节

---

## 测试环境

### 必要条件

- [ ] Docker MySQL 已启动
- [ ] 测试数据已初始化
- [ ] Resend 邮件服务已配置
- [ ] 测试账号准备

### 启动命令

```bash
# 启动数据库
docker-compose up -d mysql

# 启动开发服务器
npm run dev
```

### 测试账号

| 用途       | 邮箱              | 密码       |
| ---------- | ----------------- | ---------- |
| 主测试账号 | test@example.com  | Test123!@# |
| 副测试账号 | test2@example.com | Test123!@# |

---

## 测试报告模板

### 执行摘要

- **执行日期**：******\_\_\_******
- **执行人**：******\_\_\_******
- **环境**：******\_\_\_******
- **版本/提交**：******\_\_\_******

### 结果汇总

| 模块     | 总数    | 通过 | 失败 | 跳过 | 通过率 |
| -------- | ------- | ---- | ---- | ---- | ------ |
| 认证     | 48      |      |      |      |        |
| 八股题   | 20      |      |      |      |        |
| 代码题   | 28      |      |      |      |        |
| 收藏     | 20      |      |      |      |        |
| 题目状态 | 20      |      |      |      |        |
| 用户答案 | 20      |      |      |      |        |
| **总计** | **156** |      |      |      |        |

### 发现的问题

| 编号 | 模块 | 用例 | 问题描述 | 严重程度 |
| ---- | ---- | ---- | -------- | -------- |
|      |      |      |          |          |

### 结论

- [ ] 可发布
- [ ] 需修复后发布
- [ ] 需重测

---

## 数据清理

```sql
-- 清理测试验证码
DELETE FROM email_verification_codes WHERE email LIKE '%test%';

-- 清理测试用户进度
DELETE FROM user_code_progress WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%');
DELETE FROM user_bagu_progress WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%');
DELETE FROM user_answers WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%');

-- 清理测试用户（谨慎操作）
DELETE FROM accounts WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%');
DELETE FROM users WHERE email LIKE '%test%';
```
