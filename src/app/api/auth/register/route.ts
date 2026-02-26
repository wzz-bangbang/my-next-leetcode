import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { validateEmail, validatePasswordStrength, validateUsername } from '@/lib/validation';

// ============ 数据访问层 ============

/** 检查邮箱是否已存在 */
async function isEmailExists(email: string): Promise<boolean> {
  const existing = await query<{ id: number }[]>(
    'SELECT id FROM users WHERE email = ? AND (status IS NULL OR status = 0)',
    [email]
  );
  return existing.length > 0;
}

/** 创建用户 */
async function createUser(username: string, email: string, passwordHash: string) {
  await query(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, passwordHash]
  );
}

// ============ 业务逻辑层 ============

/** 注册新用户 */
async function registerUser(email: string, password: string, name?: string) {
  // 检查邮箱是否已存在
  if (await isEmailExists(email)) {
    return { ok: false, status: 409, error: '该邮箱已注册' };
  }

  // 加密密码并创建用户
  const passwordHash = await bcrypt.hash(password, 10);
  const username = name || email.split('@')[0];
  await createUser(username, email, passwordHash);

  return { ok: true };
}

// ============ 接口处理层 ============

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // 参数校验
    if (!email || !password) {
      return Response.json({ error: '邮箱和密码不能为空' }, { status: 400 });
    }
    const usernameValidation = validateUsername(name || '');
    if (!usernameValidation.valid) {
      return Response.json({ error: usernameValidation.message }, { status: 400 });
    }
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return Response.json({ error: emailValidation.message }, { status: 400 });
    }
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return Response.json({ error: passwordValidation.message }, { status: 400 });
    }

    // 注册用户
    const result = await registerUser(email, password, name);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }

    return Response.json({ success: true, message: '注册成功' });
  } catch (error) {
    console.error('[Register] Error:', error);
    return Response.json({ error: '注册失败，请稍后重试' }, { status: 500 });
  }
}
