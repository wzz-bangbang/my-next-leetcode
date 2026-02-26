import { query } from '@/lib/db';
import { validateEmail } from '@/lib/validation';
import { CODE_TYPE } from '@/lib/email';
import { encode } from 'next-auth/jwt';
import { cookies } from 'next/headers';

// ============ 类型定义 ============

interface VerificationCode {
  id: number;
  code: string;
  verify_attempts: number;
  locked_until: Date | null;
}

interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
}

const MAX_VERIFY_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

// ============ 数据访问层 ============

/** 获取最近的有效验证码 */
async function getLatestValidCode(email: string): Promise<VerificationCode | null> {
  const codes = await query<VerificationCode[]>(
    `SELECT id, code, verify_attempts, locked_until FROM email_verification_codes 
     WHERE email = ? AND type = ? AND used = 0 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email, CODE_TYPE.LOGIN]
  );
  return codes[0] || null;
}

/** 更新验证码尝试次数 */
async function updateCodeAttempts(codeId: number, attempts: number, lockedUntil?: Date) {
  if (lockedUntil) {
    await query(
      'UPDATE email_verification_codes SET verify_attempts = ?, locked_until = ? WHERE id = ?',
      [attempts, lockedUntil, codeId]
    );
  } else {
    await query(
      'UPDATE email_verification_codes SET verify_attempts = ? WHERE id = ?',
      [attempts, codeId]
    );
  }
}

/** 标记验证码已使用 */
async function markCodeUsed(codeId: number) {
  await query('UPDATE email_verification_codes SET used = 1 WHERE id = ?', [codeId]);
}

/** 查找用户 */
async function findUserByEmail(email: string): Promise<User | null> {
  const users = await query<User[]>(
    'SELECT id, username, email, avatar FROM users WHERE email = ? AND (status IS NULL OR status = 0)',
    [email]
  );
  return users[0] || null;
}

/** 创建新用户 */
async function createUser(email: string): Promise<User> {
  const username = email.split('@')[0].slice(0, 20);
  const result = await query<{ insertId: number }>(
    'INSERT INTO users (username, email) VALUES (?, ?)',
    [username, email]
  );
  return {
    id: (result as unknown as { insertId: number }).insertId,
    username,
    email,
    avatar: null,
  };
}

// ============ 业务逻辑层 ============

/** 验证验证码 */
async function verifyCode(email: string, inputCode: string) {
  const codeRecord = await getLatestValidCode(email);
  
  if (!codeRecord) {
    return { ok: false, status: 400, error: '验证码已过期或不存在，请重新获取' };
  }

  // 检查是否被锁定
  if (codeRecord.locked_until && new Date(codeRecord.locked_until) > new Date()) {
    const remainingMinutes = Math.ceil(
      (new Date(codeRecord.locked_until).getTime() - Date.now()) / 60000
    );
    return { ok: false, status: 429, error: `验证码错误次数过多，请 ${remainingMinutes} 分钟后再试` };
  }

  // 验证码错误
  if (codeRecord.code !== inputCode) {
    const newAttempts = (codeRecord.verify_attempts || 0) + 1;
    
    if (newAttempts >= MAX_VERIFY_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
      await updateCodeAttempts(codeRecord.id, newAttempts, lockedUntil);
      return { ok: false, status: 429, error: `验证码错误次数过多，已锁定 ${LOCK_DURATION_MINUTES} 分钟` };
    }

    await updateCodeAttempts(codeRecord.id, newAttempts);
    const remaining = MAX_VERIFY_ATTEMPTS - newAttempts;
    return { ok: false, status: 400, error: `验证码错误，还剩 ${remaining} 次尝试机会` };
  }

  // 验证成功
  await markCodeUsed(codeRecord.id);
  return { ok: true };
}

/** 查找或创建用户 */
async function findOrCreateUser(email: string): Promise<{ user: User; isNewUser: boolean }> {
  let user = await findUserByEmail(email);
  if (user) {
    return { user, isNewUser: false };
  }
  user = await createUser(email);
  return { user, isNewUser: true };
}

/** 创建并设置 session */
async function createSession(user: User) {
  const token = await encode({
    token: {
      sub: String(user.id),
      name: user.username, 
      email: user.email,
      picture: user.avatar,
    },
    secret: process.env.AUTH_SECRET!,
    maxAge: 30 * 24 * 60 * 60,
  });

  const cookieStore = await cookies();
  cookieStore.set('authjs.session-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
}

// ============ 接口处理层 ============

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    // 参数校验
    if (!code || code.length !== 6) {
      return Response.json({ error: '请输入6位验证码' }, { status: 400 });
    }
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return Response.json({ error: emailValidation.message }, { status: 400 });
    }

    // 验证验证码
    const verifyResult = await verifyCode(email, code);
    if (!verifyResult.ok) {
      return Response.json({ error: verifyResult.error }, { status: verifyResult.status });
    }

    // 查找或创建用户
    const { user, isNewUser } = await findOrCreateUser(email);

    // 创建 session
    await createSession(user);

    return Response.json({ 
      success: true, 
      isNewUser,
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        image: user.avatar,
      }
    });
  } catch (error) {
    console.error('[LoginWithCode] Error:', error);
    return Response.json({ error: '登录失败，请稍后重试' }, { status: 500 });
  }
}
