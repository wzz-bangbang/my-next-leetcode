import { query } from '@/lib/db';
import { validateEmail } from '@/lib/validation';
import { CODE_TYPE } from '@/lib/email';
import { encode } from 'next-auth/jwt';
import { cookies } from 'next/headers';

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

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    // 参数验证
    if (!code || code.length !== 6) {
      return Response.json({ error: '请输入6位验证码' }, { status: 400 });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return Response.json({ error: emailValidation.message }, { status: 400 });
    }

    // 查询最近一条未过期、未使用的验证码
    const codes = await query<VerificationCode[]>(
      `SELECT id, code, verify_attempts, locked_until FROM email_verification_codes 
       WHERE email = ? AND type = ? AND used = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, CODE_TYPE.LOGIN]
    );

    if (codes.length === 0) {
      return Response.json({ error: '验证码已过期或不存在，请重新获取' }, { status: 400 });
    }

    const codeRecord = codes[0];

    // 检查是否被锁定
    if (codeRecord.locked_until && new Date(codeRecord.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil(
        (new Date(codeRecord.locked_until).getTime() - Date.now()) / 60000
      );
      return Response.json(
        { error: `验证码错误次数过多，请 ${remainingMinutes} 分钟后再试` },
        { status: 429 }
      );
    }

    // 验证验证码
    if (codeRecord.code !== code) {
      const newAttempts = (codeRecord.verify_attempts || 0) + 1;
      
      // 如果达到最大尝试次数，锁定30分钟
      if (newAttempts >= MAX_VERIFY_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
        await query(
          'UPDATE email_verification_codes SET verify_attempts = ?, locked_until = ? WHERE id = ?',
          [newAttempts, lockedUntil, codeRecord.id]
        );
        return Response.json(
          { error: `验证码错误次数过多，已锁定 ${LOCK_DURATION_MINUTES} 分钟` },
          { status: 429 }
        );
      }

      // 更新尝试次数
      await query(
        'UPDATE email_verification_codes SET verify_attempts = ? WHERE id = ?',
        [newAttempts, codeRecord.id]
      );

      const remaining = MAX_VERIFY_ATTEMPTS - newAttempts;
      return Response.json(
        { error: `验证码错误，还剩 ${remaining} 次尝试机会` },
        { status: 400 }
      );
    }

    // 标记验证码已使用
    await query('UPDATE email_verification_codes SET used = 1 WHERE id = ?', [codeRecord.id]);

    // 查找或创建用户
    let users = await query<User[]>(
      'SELECT id, username, email, avatar FROM users WHERE email = ? AND (status IS NULL OR status = 0)',
      [email]
    );

    let isNewUser = false;
    let user: User;

    if (users.length === 0) {
      // 自动注册新用户
      const username = email.split('@')[0].slice(0, 20); // 取邮箱前缀作为用户名
      const result = await query<{ insertId: number }>(
        'INSERT INTO users (username, email) VALUES (?, ?)',
        [username, email]
      );
      
      user = {
        id: (result as unknown as { insertId: number }).insertId,
        username,
        email,
        avatar: null,
      };
      isNewUser = true;
    } else {
      user = users[0];
    }

    // 创建 session token
    const token = await encode({
      token: {
        sub: String(user.id),
        name: user.username,
        email: user.email,
        picture: user.avatar,
      },
      secret: process.env.AUTH_SECRET!,
      maxAge: 30 * 24 * 60 * 60, // 30 天
    });

    // 设置 cookie
    const cookieStore = await cookies();
    cookieStore.set('authjs.session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

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
