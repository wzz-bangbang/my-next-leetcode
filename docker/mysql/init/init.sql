-- 初始化数据库脚本
CREATE DATABASE IF NOT EXISTS leetcode DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE leetcode;

-- ========== 用户相关表 ==========

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 默认匿名用户
INSERT INTO users (id, username, email) VALUES (1, 'local_user', 'local@localhost')
ON DUPLICATE KEY UPDATE username = username;

-- ========== 代码题相关表 ==========

-- 代码题分类表
-- id: 1=JS分析, 2=JS手写, 3=TS类型, 4=React, 6=算法
CREATE TABLE IF NOT EXISTS code_categories (
    id TINYINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(10),
    sort_order TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化代码题分类
INSERT INTO code_categories (id, name, icon, sort_order) VALUES
  (1, 'JS代码分析题', '🔍', 1),
  (2, 'JS手写题', '✍️', 2),
  (3, 'TS类型题', '📘', 3),
  (4, 'React代码题', '⚛️', 4),
  (6, '算法题', '🧮', 6)
ON DUPLICATE KEY UPDATE name = VALUES(name), icon = VALUES(icon);

-- 代码题表
CREATE TABLE IF NOT EXISTS code_questions (
    id INT PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    category_ids JSON COMMENT '分类ID数组，如 [1,2]',
    difficulty TINYINT NOT NULL DEFAULT 1 COMMENT '1=简单, 2=中等, 3=困难',
    description TEXT,
    template TEXT,
    solution TEXT,
    test_cases JSON,
    follow_up JSON,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== 八股文相关表 ==========

-- 八股文分类表
-- id: 1=JS基础, 2=TypeScript, 3=CSS&HTML, 4=React, 5=Vue, 6=浏览器, 7=Next.js, 8=工程化, 9=CI&CD, 10=开放题&场景题, 11=小程序, 12=AI, 13=技术选型, 14=工作协作
CREATE TABLE IF NOT EXISTS bagu_categories (
    id TINYINT PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(10),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 八股文题目表
CREATE TABLE IF NOT EXISTS bagu_questions (
    id INT PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    category_id TINYINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    has_answer TINYINT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES bagu_categories(id) ON DELETE CASCADE,
    INDEX idx_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== 用户数据表 ==========

-- 用户答案表（代码题）
CREATE TABLE IF NOT EXISTS user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 1,
    question_id INT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_question (user_id, question_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 收藏表
-- question_type: 1=code, 2=bagu
CREATE TABLE IF NOT EXISTS user_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 1,
    question_id INT NOT NULL,
    question_type TINYINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_favorite (user_id, question_id, question_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 题目状态表
-- question_type: 1=code, 2=bagu
-- status: 0=未开始, 1=尝试中, 2=已完成
CREATE TABLE IF NOT EXISTS user_question_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 1,
    question_id INT NOT NULL,
    question_type TINYINT NOT NULL DEFAULT 1,
    status TINYINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_status (user_id, question_id, question_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_type (question_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 笔记表
CREATE TABLE IF NOT EXISTS user_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 1,
    question_id INT NOT NULL,
    question_type TINYINT NOT NULL DEFAULT 1,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_note (user_id, question_id, question_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
