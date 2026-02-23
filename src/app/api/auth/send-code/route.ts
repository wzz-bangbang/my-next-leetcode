import { headers } from 'next/headers';
import { query } from '@/lib/db';
import { validateEmail } from '@/lib/validation';
import { generateCode, sendVerificationEmail, CODE_TYPE, CodeType } from '@/lib/email';

interface CountResult {
  count: number;
}

interface LockResult {
  locked_until: Date | null;
}

// 获取客户端 IP
async function getClientIP(): Promise<string> {
  const headersList = await headers();
  // 优先从 x-forwarded-for 获取（经过代理）
  const forwarded = headersList.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  // 其次从 x-real-ip 获取
  const realIP = headersList.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  // 默认返回 unknown
  return 'unknown';
}

export async function POST(request: Request) {
  try {
    const { email, type = CODE_TYPE.LOGIN } = await request.json();
    const ip = await getClientIP();

    // 验证邮箱格式
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return Response.json({ error: emailValidation.message }, { status: 400 });
    }

    // 验证 type 参数
    if (![CODE_TYPE.LOGIN, CODE_TYPE.RESET].includes(type)) {
      return Response.json({ error: '无效的验证码类型' }, { status: 400 });
    }

    // 检查该邮箱是否被锁定（连续错误5次后锁定30分钟）
    const lockStatus = await query<LockResult[]>(
      `SELECT locked_until FROM email_verification_codes 
       WHERE email = ? AND locked_until > NOW() 
       ORDER BY locked_until DESC LIMIT 1`,
      [email]
    );
    if (lockStatus.length > 0 && lockStatus[0].locked_until) {
      const remainingMinutes = Math.ceil(
        (new Date(lockStatus[0].locked_until).getTime() - Date.now()) / 60000
      );
      return Response.json(
        { error: `验证码错误次数过多，请 ${remainingMinutes} 分钟后再试` },
        { status: 429 }
      );
    }

    // 检查发送频率限制1：同一邮箱60秒内只能发一次
    const recentByEmail = await query<CountResult[]>(
      `SELECT COUNT(*) as count FROM email_verification_codes 
       WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)`,
      [email]
    );
    if (recentByEmail[0].count > 0) {
      return Response.json({ error: '请稍后再试，60秒内只能发送一次' }, { status: 429 });
    }

    // 检查发送频率限制2：同一邮箱10分钟内最多3次
    const tenMinByEmail = await query<CountResult[]>(
      `SELECT COUNT(*) as count FROM email_verification_codes 
       WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
      [email]
    );
    if (tenMinByEmail[0].count >= 3) {
      return Response.json({ error: '发送过于频繁，请10分钟后再试' }, { status: 429 });
    }

    // 检查发送频率限制3：同一IP每小时最多10次
    if (ip !== 'unknown') {
      const hourByIP = await query<CountResult[]>(
        `SELECT COUNT(*) as count FROM email_verification_codes 
         WHERE ip = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
        [ip]
      );
      if (hourByIP[0].count >= 10) {
        return Response.json({ error: '当前网络发送过于频繁，请稍后再试' }, { status: 429 });
      }
    }

    // 重置密码时，检查邮箱是否已注册
    if (type === CODE_TYPE.RESET) {
      const users = await query<{ id: number }[]>(
        'SELECT id FROM users WHERE email = ? AND (status IS NULL OR status = 0)',
        [email]
      );
      if (users.length === 0) {
        return Response.json({ error: '该邮箱未注册' }, { status: 400 });
      }
    }

    // 生成验证码
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

    // 存入数据库（包含IP）
    await query(
      'INSERT INTO email_verification_codes (email, code, type, ip, expires_at) VALUES (?, ?, ?, ?, ?)',
      [email, code, type, ip, expiresAt]
    );

    // 发送邮件
    const result = await sendVerificationEmail(email, code, type as CodeType);
    
    if (!result.success) {
      return Response.json({ error: result.error || '发送失败' }, { status: 500 });
    }

    return Response.json({ success: true, message: '验证码已发送' });
  } catch (error) {
    console.error('[SendCode] Error:', error);
    return Response.json({ error: '发送失败，请稍后重试' }, { status: 500 });
  }
}
