import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { validateEmail, validatePasswordStrength } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // 参数验证
    if (!email || !password) {
      return Response.json({ error: '邮箱和密码不能为空' }, { status: 400 });
    }

    // 邮箱格式校验
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return Response.json({ error: emailValidation.message }, { status: 400 });
    }

    // 密码强度校验
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return Response.json({ error: passwordValidation.message }, { status: 400 });
    }

    // 检查邮箱是否已存在（排除已注销的账号，status = 1 表示已注销）
    const existing = await query<{ id: number }[]>(
      'SELECT id FROM users WHERE email = ? AND (status IS NULL OR status = 0)',
      [email]
    );

    if (existing.length > 0) {
      return Response.json({ error: '该邮箱已注册' }, { status: 400 });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 存入数据库（用户名可重复，邮箱+状态组合判断唯一）
    await query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [name || email.split('@')[0], email, passwordHash]
    );

    return Response.json({ success: true, message: '注册成功' });
  } catch (error) {
    console.error('[Register] Error:', error);
    return Response.json({ error: '注册失败，请稍后重试' }, { status: 500 });
  }
}
