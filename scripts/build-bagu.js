/**
 * 八股文 MD 文件解析脚本
 * 解析 public/bagu/ 下的所有 MD 文件，生成 bagu-data.json
 *
 * 运行: npm run build:bagu
 */

const fs = require('fs');
const path = require('path');

// 配置：分类ID映射（文件名 -> ID）
const CATEGORY_CONFIG = {
  'React.md': { id: 'react', name: 'React' },
  'Vue.md': { id: 'vue', name: 'Vue' },
  'JavaScript基础.md': { id: 'js-basic', name: 'JS基础' },
  'TypeScript.md': { id: 'typescript', name: 'TypeScript' },
  'CSS&HTML.md': { id: 'css-html', name: 'CSS & HTML' },
  '浏览器.md': { id: 'browser', name: '浏览器' },
  '网络、安全与前端请求.md': { id: 'network', name: '网络' },
  '工程化.md': { id: 'engineering', name: '工程化' },
  // 'Node.md': { id: 'node', name: 'Node.js' },
  'Nextjs.md': { id: 'nextjs', name: 'Next.js' },
  '小程序.md': { id: 'miniprogram', name: '小程序' },
  'Ai及应用.md': { id: 'ai', name: 'AI' },
  'CI&CD.md': { id: 'cicd', name: 'CI&CD' },
  '技术选型.md': { id: 'tech-selection', name: '技术选型' },
  '工作协作.md': { id: 'teamwork', name: '工作协作' },
  '面试技巧.md': { id: 'interview-tips', name: '面试技巧' },
  // 文件夹类型
  '开放题&场景题': {
    id: 'open-questions',
    name: '开放题&场景题',
    isFolder: true,
  },
};

// 源目录和输出文件
const BAGU_DIR = path.join(__dirname, '../public/bagu');
const OUTPUT_FILE = path.join(__dirname, '../public/bagu-data.json');

/**
 * 清理标题中的 Markdown 标签
 */
function cleanTitle(title) {
  return title
    .replace(/\*\*([^*]+)\*\*/g, '$1') // 去掉 **粗体**
    .replace(/\*([^*]+)\*/g, '$1') // 去掉 *斜体*
    .replace(/__([^_]+)__/g, '$1') // 去掉 __粗体__
    .replace(/_([^_]+)_/g, '$1') // 去掉 _斜体_
    .replace(/~~([^~]+)~~/g, '$1') // 去掉 ~~删除线~~
    .replace(/`([^`]+)`/g, '$1') // 去掉 `代码`
    .replace(/<mark>([^<]+)<\/mark>/gi, '$1') // 去掉 <mark>高亮</mark>
    .replace(/<[^>]+>/g, '') // 去掉其他 HTML 标签
    .trim();
}

/**
 * 解析普通 MD 文件，提取标题作为题目
 */
function parseMdFile(filePath, categoryId) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const questions = [];

  let currentQuestion = null;
  let contentLines = [];
  let questionIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 匹配标题 (##, ###, ####, #####)
    const headerMatch = line.match(/^(#{2,5})\s+(.+)$/);

    if (headerMatch) {
      // 保存上一个问题
      if (currentQuestion) {
        const trimmedContent = contentLines.join('\n').trim();
        currentQuestion.content = trimmedContent;
        currentQuestion.hasAnswer = trimmedContent.length > 0;
        questions.push(currentQuestion);
      }

      // 开始新问题
      questionIndex++;
      const title = cleanTitle(headerMatch[2].trim());
      currentQuestion = {
        id: `${categoryId}-${questionIndex}`,
        title: title,
        content: '',
        hasAnswer: false,
      };
      contentLines = [];
    } else if (currentQuestion) {
      // 收集内容行
      contentLines.push(line);
    } else {
      // 没有标题的情况：每行非空内容作为一个问题
      const trimmedLine = line.trim();
      if (
        trimmedLine &&
        !trimmedLine.startsWith('```') &&
        !trimmedLine.startsWith('//')
      ) {
        // 检查是不是问题行（通常比较短，不是代码）
        if (trimmedLine.length < 100 && !trimmedLine.includes('console.log')) {
          questionIndex++;
          questions.push({
            id: `${categoryId}-${questionIndex}`,
            title: cleanTitle(trimmedLine),
            content: '',
            hasAnswer: false,
          });
        }
      }
    }
  }

  // 保存最后一个问题
  if (currentQuestion) {
    const trimmedContent = contentLines.join('\n').trim();
    currentQuestion.content = trimmedContent;
    currentQuestion.hasAnswer = trimmedContent.length > 0;
    questions.push(currentQuestion);
  }

  return questions;
}

/**
 * 解析带标题的 MD 文件（更智能的解析）
 * 支持多级标题，将内容归属到最近的标题
 */
function parseMdFileWithHeaders(filePath, categoryId) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const questions = [];

  let currentQuestion = null;
  let contentLines = [];
  let questionIndex = 0;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测代码块
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (currentQuestion) {
        contentLines.push(line);
      }
      continue;
    }

    // 在代码块内，直接添加内容
    if (inCodeBlock) {
      if (currentQuestion) {
        contentLines.push(line);
      }
      continue;
    }

    // 匹配标题 (##, ###, ####, #####, ######)
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headerMatch) {
      // 保存上一个问题
      if (currentQuestion) {
        const trimmedContent = contentLines.join('\n').trim();
        currentQuestion.content = trimmedContent;
        currentQuestion.hasAnswer = trimmedContent.length > 0;
        questions.push(currentQuestion);
      }

      // 开始新问题
      questionIndex++;
      const title = cleanTitle(headerMatch[2].trim());
      currentQuestion = {
        id: `${categoryId}-${questionIndex}`,
        title: title,
        content: '',
        hasAnswer: false,
      };
      contentLines = [];
    } else if (currentQuestion) {
      // 收集内容行
      contentLines.push(line);
    }
  }

  // 保存最后一个问题
  if (currentQuestion) {
    const trimmedContent = contentLines.join('\n').trim();
    currentQuestion.content = trimmedContent;
    currentQuestion.hasAnswer = trimmedContent.length > 0;
    questions.push(currentQuestion);
  }

  // 如果没有通过标题找到问题，尝试按行解析
  if (questions.length === 0) {
    return parseByLines(content, categoryId);
  }

  return questions;
}

/**
 * 按行解析（适用于没有标题的文件，如 react.md）
 */
function parseByLines(content, categoryId) {
  const lines = content.split('\n');
  const questions = [];
  let questionIndex = 0;
  let inCodeBlock = false;
  let currentQuestion = null;
  let contentLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // 检测代码块
    if (trimmedLine.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (currentQuestion) {
        contentLines.push(line);
      }
      continue;
    }

    if (inCodeBlock) {
      if (currentQuestion) {
        contentLines.push(line);
      }
      continue;
    }

    // 空行可能是问题之间的分隔
    if (!trimmedLine) {
      continue;
    }

    // 判断是否是新问题（通常是简短的一行，以问号结尾或者是陈述句）
    const isQuestion =
      trimmedLine.length < 80 &&
      !trimmedLine.startsWith('-') &&
      !trimmedLine.startsWith('*') &&
      !trimmedLine.startsWith('//') &&
      !trimmedLine.match(/^\d+\.?\s/) && // 不是数字开头的列表
      (trimmedLine.endsWith('?') ||
        trimmedLine.endsWith('？') ||
        trimmedLine.match(/^[a-zA-Z\u4e00-\u9fa5]/)); // 以字母或中文开头

    // 判断是否是答案内容
    const isAnswer =
      trimmedLine.startsWith('-') ||
      trimmedLine.startsWith('*') ||
      trimmedLine.startsWith('//') ||
      trimmedLine.match(/^\d+[\.\、]/) ||
      trimmedLine.startsWith('答') ||
      trimmedLine.startsWith('解');

    if (isQuestion && !isAnswer) {
      // 保存上一个问题
      if (currentQuestion) {
        const trimmedContent = contentLines.join('\n').trim();
        currentQuestion.content = trimmedContent;
        currentQuestion.hasAnswer = trimmedContent.length > 0;
        questions.push(currentQuestion);
      }

      questionIndex++;
      currentQuestion = {
        id: `${categoryId}-${questionIndex}`,
        title: cleanTitle(trimmedLine),
        content: '',
        hasAnswer: false,
      };
      contentLines = [];
    } else if (currentQuestion) {
      contentLines.push(line);
    }
  }

  // 保存最后一个问题
  if (currentQuestion) {
    const trimmedContent = contentLines.join('\n').trim();
    currentQuestion.content = trimmedContent;
    currentQuestion.hasAnswer = trimmedContent.length > 0;
    questions.push(currentQuestion);
  }

  return questions;
}

/**
 * 解析文件夹（每个文件作为一道题）
 */
function parseFolder(folderPath, categoryId) {
  const questions = [];
  const files = fs.readdirSync(folderPath);
  let questionIndex = 0;

  for (const file of files) {
    // 跳过非 MD 文件
    if (!file.endsWith('.md')) continue;

    const filePath = path.join(folderPath, file);
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    const title = cleanTitle(file.replace('.md', ''));

    questionIndex++;
    questions.push({
      id: `${categoryId}-${questionIndex}`,
      title: title,
      content: content,
      hasAnswer: content.length > 50, // 内容超过50字符认为有答案
    });
  }

  return questions;
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始解析八股文 MD 文件...\n');

  const categories = [];
  const items = fs.readdirSync(BAGU_DIR);

  for (const item of items) {
    const itemPath = path.join(BAGU_DIR, item);
    const stat = fs.statSync(itemPath);

    // 获取配置
    const config = CATEGORY_CONFIG[item];

    if (stat.isDirectory()) {
      // 文件夹
      if (!config) {
        console.log(`⚠️  跳过未配置的文件夹: ${item}`);
        continue;
      }

      console.log(`📁 解析文件夹: ${item}`);
      const questions = parseFolder(itemPath, config.id);

      categories.push({
        id: config.id,
        name: config.name,
        isFolder: true,
        questions: questions,
      });

      console.log(`   ✅ 找到 ${questions.length} 道题目\n`);
    } else if (item.endsWith('.md')) {
      // MD 文件
      if (!config) {
        console.log(`⚠️  跳过未配置的文件: ${item}`);
        continue;
      }

      console.log(`📄 解析文件: ${item}`);
      const questions = parseMdFileWithHeaders(itemPath, config.id);

      categories.push({
        id: config.id,
        name: config.name,
        questions: questions,
      });

      console.log(`   ✅ 找到 ${questions.length} 道题目\n`);
    }
  }

  // 按分类ID排序
  categories.sort((a, b) => {
    const order = [
      'js-basic',
      'typescript',
      'css-html',
      'react',
      'vue',
      'browser',
      'network',
      'node',
      'nextjs',
      'engineering',
      'cicd',
      'cdn',
      'handwrite',
      'code-explain',
      'open-questions',
      'miniprogram',
      'ai',
      'tech-selection',
      'projects',
      'teamwork',
      'interview-tips',
      'career-plan',
      'history',
    ];
    return order.indexOf(a.id) - order.indexOf(b.id);
  });

  // 生成输出数据
  const output = {
    categories: categories,
    generatedAt: new Date().toISOString(),
  };

  // 写入文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  // 统计
  const totalQuestions = categories.reduce(
    (sum, cat) => sum + cat.questions.length,
    0,
  );
  const answeredQuestions = categories.reduce(
    (sum, cat) => sum + cat.questions.filter((q) => q.hasAnswer).length,
    0,
  );

  console.log('='.repeat(50));
  console.log(`✨ 解析完成！`);
  console.log(`   📚 分类数: ${categories.length}`);
  console.log(`   📝 题目总数: ${totalQuestions}`);
  console.log(`   ✅ 已有答案: ${answeredQuestions}`);
  console.log(`   ❌ 待补充: ${totalQuestions - answeredQuestions}`);
  console.log(`   📄 输出文件: ${OUTPUT_FILE}`);
}

main();
