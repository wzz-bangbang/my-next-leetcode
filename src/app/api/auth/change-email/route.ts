/**
 * 换绑邮箱 API
 * POST /api/auth/change-email
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { validateEmail } from '@/lib/validation';
import { CODE_TYPE } from '@/lib/email';
import { verifyCodeWithMatch, markCodeUsed } from '@/lib/verifyCode';

// ============ 数据访问层 ============

/** 检查邮箱是否已被其他用户使用 */
async function isEmailTaken(email: string, excludeUserId: string): Promise<boolean> {
  const users = await query<{ id: number }[]>(
    'SELECT id FROM users WHERE email = ? AND id != ? AND (status IS NULL OR status = 0)',
    [email, excludeUserId]
  );
  return users.length > 0;
}

/** 更新用户邮箱 */
async function updateUserEmail(userId: string, newEmail: string) {
  await query('UPDATE users SET email = ? WHERE id = ?', [newEmail, userId]);
}

// ============ 业务逻辑层 ============

/** 换绑邮箱核心逻辑 */
async function changeEmailLogic(userId: string, newEmail: string, codeId: number) {
  await markCodeUsed(codeId);
  await updateUserEmail(userId, newEmail);
  console.log('[Auth] Email changed for user:', userId, 'to:', newEmail);
}

// ============ 接口处理层 ============

export async function POST(request: Request) {
  try {
    // 验证登录状态
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    const userId = session.user.id;

    const { newEmail, code } = await request.json();

    // 参数校验
    const emailValidation = validateEmail(newEmail);
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.message }, { status: 400 });
    }
    if (!code || code.length !== 6) {
      return NextResponse.json({ error: '验证码无效' }, { status: 400 });
    }

    // 检查邮箱是否已被使用
    if (await isEmailTaken(newEmail, userId)) {
      return NextResponse.json({ error: '该邮箱已被使用' }, { status: 409 });
    }

    // 验证验证码
    const verifyResult = await verifyCodeWithMatch(newEmail, code, CODE_TYPE.CHANGE_EMAIL);
    if (!verifyResult.ok) {
      return NextResponse.json({ error: verifyResult.error }, { status: verifyResult.status });
    }

    // 换绑邮箱
    await changeEmailLogic(userId, newEmail, verifyResult.codeId!);

    return NextResponse.json({ message: '邮箱换绑成功' });
  } catch (error) {
    console.error('[Auth] Change email error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
