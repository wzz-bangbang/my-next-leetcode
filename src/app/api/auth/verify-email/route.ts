/**
 * 验证当前用户邮箱 API
 * POST /api/auth/verify-email
 * 用于换绑邮箱第一步：验证旧邮箱
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { CODE_TYPE } from '@/lib/email';

// ============ 类型定义 ============

interface VerificationCode {
  id: number;
  verify_attempts: number;
  locked_until: Date | null;
}

const MAX_VERIFY_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

// ============ 数据访问层 ============

/** 获取有效验证码（需要验证码匹配） */
async function getValidCodeWithMatch(email: string, code: string): Promise<VerificationCode | null> {
  const codes = await query<VerificationCode[]>(
    `SELECT id, verify_attempts, locked_until FROM email_verification_codes 
     WHERE email = ? AND code = ? AND type = ? AND used = 0 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email, code, CODE_TYPE.LOGIN]
  );
  return codes[0] || null;
}

/** 增加验证码尝试次数 */
async function incrementCodeAttempts(email: string) {
  await query(
    `UPDATE email_verification_codes SET verify_attempts = verify_attempts + 1 
     WHERE email = ? AND type = ? AND used = 0`,
    [email, CODE_TYPE.LOGIN]
  );
}

/** 锁定验证码 */
async function lockCode(codeId: number) {
  await query(
    `UPDATE email_verification_codes SET locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?`,
    [LOCK_DURATION_MINUTES, codeId]
  );
}

/** 标记验证码已使用 */
async function markCodeUsed(codeId: number) {
  await query('UPDATE email_verification_codes SET used = 1 WHERE id = ?', [codeId]);
}

// ============ 业务逻辑层 ============

/** 验证验证码 */
async function verifyCode(email: string, code: string) {
  const codeRecord = await getValidCodeWithMatch(email, code);
  
  if (!codeRecord) {
    await incrementCodeAttempts(email);
    return { ok: false, status: 400, error: '验证码错误或已过期', codeId: null };
  }

  // 检查是否被锁定
  if (codeRecord.locked_until && new Date(codeRecord.locked_until) > new Date()) {
    return { ok: false, status: 429, error: '尝试次数过多，请30分钟后再试', codeId: null };
  }

  // 检查尝试次数
  if (codeRecord.verify_attempts >= MAX_VERIFY_ATTEMPTS) {
    await lockCode(codeRecord.id);
    return { ok: false, status: 429, error: '尝试次数过多，请30分钟后再试', codeId: null };
  }

  return { ok: true, codeId: codeRecord.id };
}

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

    // 验证验证码
    const verifyResult = await verifyCode(email, code);
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
