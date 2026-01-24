const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'wzz',
    password: 'wzz888888',
    database: 'leetcode',
  });

  try {
    // 读取 answers.json
    const answersPath = path.join(__dirname, '../public/answers.json');
    const answersData = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));

    const entries = Object.entries(answersData);
    console.log(`找到 ${entries.length} 条答案数据`);

    let successCount = 0;
    for (const [questionId, code] of entries) {
      if (code && typeof code === 'string' && code.trim()) {
        try {
          await pool.execute(
            `INSERT INTO user_answers (user_id, question_id, category_tag, code)
             VALUES (1, ?, 0, ?)
             ON DUPLICATE KEY UPDATE code = VALUES(code), updated_at = CURRENT_TIMESTAMP`,
            [questionId, code]
          );
          console.log(`✓ ${questionId}`);
          successCount++;
        } catch (err) {
          console.log(`✗ ${questionId}: ${err.message}`);
        }
      }
    }

    console.log(`\n迁移完成: ${successCount}/${entries.length} 条`);

    // 读取 favorites.json
    const favoritesPath = path.join(__dirname, '../public/favorites.json');
    if (fs.existsSync(favoritesPath)) {
      const favoritesData = JSON.parse(fs.readFileSync(favoritesPath, 'utf-8'));
      console.log('\n收藏数据:', favoritesData);

      // 导入 code 收藏
      if (favoritesData.code && favoritesData.code.length > 0) {
        for (const id of favoritesData.code) {
          // id 可能是 "categoryTag-questionId" 或纯 questionId
          const parts = id.split('-');
          let questionId, categoryTag;
          if (parts.length > 1 && !isNaN(parseInt(parts[0]))) {
            categoryTag = parseInt(parts[0]);
            questionId = parts.slice(1).join('-');
          } else {
            categoryTag = 0;
            questionId = id;
          }

          try {
            await pool.execute(
              `INSERT INTO user_favorites (user_id, question_id, category_tag)
               VALUES (1, ?, ?)
               ON DUPLICATE KEY UPDATE created_at = created_at`,
              [questionId, categoryTag]
            );
            console.log(`✓ 收藏: ${questionId}`);
          } catch (err) {
            console.log(`✗ 收藏 ${questionId}: ${err.message}`);
          }
        }
      }
    }

  } catch (err) {
    console.error('迁移失败:', err);
  } finally {
    await pool.end();
  }
}

migrate();
