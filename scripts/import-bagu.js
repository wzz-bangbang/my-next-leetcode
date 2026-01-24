const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importBagu() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'wzz',
    password: 'wzz888888',
    database: 'leetcode',
    charset: 'utf8mb4',
  });

  try {
    // 读取 bagu-data.json
    const baguPath = path.join(__dirname, '../public/bagu-data.json');
    const baguData = JSON.parse(fs.readFileSync(baguPath, 'utf-8'));

    console.log(`找到 ${baguData.categories.length} 个八股文分类`);

    let questionId = 1; // 全局题目ID，从1开始

    for (let catIndex = 0; catIndex < baguData.categories.length; catIndex++) {
      const category = baguData.categories[catIndex];
      const categoryId = catIndex + 1; // 分类ID从1开始

      // 插入分类
      await pool.execute(
        `INSERT INTO bagu_categories (id, slug, name, sort_order)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE slug = VALUES(slug), name = VALUES(name), sort_order = VALUES(sort_order)`,
        [categoryId, category.id, category.name, catIndex]
      );

      console.log(`\n分类 ${categoryId}: ${category.name} (${category.questions.length} 题)`);

      // 插入题目
      for (let i = 0; i < category.questions.length; i++) {
        const q = category.questions[i];
        await pool.execute(
          `INSERT INTO bagu_questions (id, slug, category_id, title, content, has_answer, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             slug = VALUES(slug),
             category_id = VALUES(category_id),
             title = VALUES(title),
             content = VALUES(content),
             has_answer = VALUES(has_answer),
             sort_order = VALUES(sort_order),
             updated_at = CURRENT_TIMESTAMP`,
          [
            questionId,
            q.id,
            categoryId,
            q.title,
            q.content || null,
            q.hasAnswer ? 1 : 0,
            questionId,
          ]
        );
        questionId++;
      }

      console.log(`  ✓ ${category.questions.length} 题已导入`);
    }

    console.log(`\n八股文导入完成: ${questionId - 1} 道`);

  } catch (err) {
    console.error('导入失败:', err);
  } finally {
    await pool.end();
  }
}

importBagu();
