/**
 * 验证当前用户邮箱 API
 * POST /api/auth/verify-email
 * 用于换绑邮箱第一步：验证旧邮箱
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CODE_TYPE } from '@/lib/email';
import { verifyCodeWithMatch, markCodeUsed } from '@/lib/verifyCode';

// ============ 接口处理层 ============

export async function POST(request: Request) {
  try {
    // 验证登录状态
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { email, code } = await request.json();

    // 参数校验
    if (email !== session.user.email) {
      return NextResponse.json({ error: '邮箱不匹配' }, { status: 400 });
    }
    if (!code || code.length !== 6) {
      return NextResponse.json({ error: '验证码无效' }, { status: 400 });
    }

    // 验证验证码（使用登录类型，因为换绑邮箱第一步用的是登录验证码）
    const verifyResult = await verifyCodeWithMatch(email, code, CODE_TYPE.LOGIN);
    if (!verifyResult.ok) {
      return NextResponse.json({ error: verifyResult.error }, { status: verifyResult.status });
    }

    // 标记验证码已使用
    await markCodeUsed(verifyResult.codeId!);

    console.log('[Auth] Email verified for user:', session.user.id);
    return NextResponse.json({ message: '验证成功' });
  } catch (error) {
    console.error('[Auth] Verify email error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
