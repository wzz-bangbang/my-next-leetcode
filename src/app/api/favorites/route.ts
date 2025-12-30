import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const FAVORITES_FILE = path.join(process.cwd(), 'public', 'favorites.json');

interface FavoritesData {
  bagu: string[];
  code: string[];
}

async function readFavorites(): Promise<FavoritesData> {
  try {
    const content = await fs.readFile(FAVORITES_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { bagu: [], code: [] };
  }
}

async function writeFavorites(data: FavoritesData): Promise<void> {
  await fs.writeFile(FAVORITES_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// GET: 获取收藏列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as 'bagu' | 'code' | null;

  const data = await readFavorites();

  if (type === 'bagu' || type === 'code') {
    return NextResponse.json({ ids: data[type] });
  }

  return NextResponse.json(data);
}

// POST: 保存收藏列表
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ids } = body;

    if (!type || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const data = await readFavorites();
    
    if (type === 'bagu' || type === 'code') {
      data[type] = ids;
      await writeFavorites(data);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Save favorites failed:', error);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}

