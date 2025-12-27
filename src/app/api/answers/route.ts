import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const answersFilePath = path.join(process.cwd(), 'public', 'answers.json');

async function getAnswers() {
  try {
    const data = await fs.readFile(answersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: unknown) {
    // If file doesn't exist, return empty object
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return {};
    }
    throw error;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get('questionId');

  const answers = await getAnswers();

  // 如果没有 questionId，返回所有答案的 questionId 列表（用于同步状态）
  if (!questionId) {
    const answeredIds = Object.keys(answers).filter(
      (id) => answers[id] && answers[id].trim(),
    );
    return NextResponse.json({ answeredIds });
  }

  const code = answers[questionId] || '';
  return NextResponse.json({ code });
}

export async function POST(request: Request) {
  const { questionId, code } = await request.json();

  if (!questionId || typeof code === 'undefined') {
    return NextResponse.json(
      { error: 'questionId and code are required' },
      { status: 400 },
    );
  }

  const answers = await getAnswers();
  answers[questionId] = code;

  await fs.writeFile(answersFilePath, JSON.stringify(answers, null, 2));

  return NextResponse.json({ success: true });
}
