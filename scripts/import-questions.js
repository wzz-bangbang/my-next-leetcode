const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importQuestions() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'wzz',
    password: 'wzz888888',
    database: 'leetcode',
    charset: 'utf8mb4',
  });

  try {
    // 读取 questions.json
    const questionsPath = path.join(__dirname, '../public/questions.json');
    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

    console.log(`找到 ${questions.length} 道代码题`);

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const questionId = i + 1; // 数字ID从1开始
      const sortOrder = i + 1;

      await pool.execute(
        `INSERT INTO code_questions (id, slug, title, category_ids, difficulty, description, template, solution, test_cases, follow_up, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           slug = VALUES(slug),
           title = VALUES(title),
           category_ids = VALUES(category_ids),
           difficulty = VALUES(difficulty),
           description = VALUES(description),
           template = VALUES(template),
           solution = VALUES(solution),
           test_cases = VALUES(test_cases),
           follow_up = VALUES(follow_up),
           sort_order = VALUES(sort_order),
           updated_at = CURRENT_TIMESTAMP`,
        [
          questionId,
          q.id, // 原来的字符串id变成slug
          q.title,
          q.tags ? JSON.stringify(q.tags) : null,
          q.difficulty || 1,
          q.description || null,
          q.template || null,
          q.solution || null,
          q.testCases ? JSON.stringify(q.testCases) : null,
          q.followUp ? JSON.stringify(q.followUp) : null,
          sortOrder,
        ]
      );

      console.log(`✓ ${questionId}: ${q.id}`);
    }

    console.log(`\n代码题导入完成: ${questions.length} 道`);

  } catch (err) {
    console.error('导入失败:', err);
  } finally {
    await pool.end();
  }
}

importQuestions();
