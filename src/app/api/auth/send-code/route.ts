import { headers } from 'next/headers';
import { query } from '@/lib/db';
import { validateEmail } from '@/lib/validation';
import { generateCode, sendVerificationEmail, CODE_TYPE, CodeType } from '@/lib/email';

// ============ 数据访问层 ============

/** 检查邮箱是否被锁定 */
async function checkEmailLocked(email: string): Promise<number | null> {
  const rows = await query<{ locked_until: Date | null }[]>(
    `SELECT locked_until FROM email_verification_codes 
     WHERE email = ? AND locked_until > NOW() 
     ORDER BY locked_until DESC LIMIT 1`,
    [email]
  );
  if (rows.length > 0 && rows[0].locked_until) {
    return Math.ceil((new Date(rows[0].locked_until).getTime() - Date.now()) / 60000);
  }
  return null;
}

/** 获取邮箱在指定时间内的发送次数 */
async function getEmailSendCount(email: string, intervalSeconds: number): Promise<number> {
  const rows = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM email_verification_codes 
     WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)`,
    [email, intervalSeconds]
  );
  return rows[0].count;
}

/** 获取 IP 在指定时间内的发送次数 */
async function getIPSendCount(ip: string, intervalSeconds: number): Promise<number> {
  const rows = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM email_verification_codes 
     WHERE ip = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)`,
    [ip, intervalSeconds]
  );
  return rows[0].count;
}

/** 检查用户是否存在 */
async function checkUserExists(email: string): Promise<boolean> {
  const rows = await query<{ id: number }[]>(
    'SELECT id FROM users WHERE email = ? AND (status IS NULL OR status = 0)',
    [email]
  );
  return rows.length > 0;
}

/** 保存验证码 */
async function saveCode(email: string, code: string, type: number, ip: string, expiresAt: Date) {
  await query(
    'INSERT INTO email_verification_codes (email, code, type, ip, expires_at) VALUES (?, ?, ?, ?, ?)',
    [email, code, type, ip, expiresAt]
  );
}

// ============ 业务逻辑层 ============

/** 获取客户端 IP */
async function getClientIP(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIP = headersList.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}

/** 检查发送频率限制 */
async function checkRateLimit(email: string, ip: string): Promise<{ ok: boolean; error?: string }> {
  // 检查锁定状态
  const lockedMinutes = await checkEmailLocked(email);
  if (lockedMinutes) {
    return { ok: false, error: `验证码错误次数过多，请 ${lockedMinutes} 分钟后再试` };
  }

  // 60秒内只能发1次
  const recent = await getEmailSendCount(email, 60);
  if (recent > 0) {
    return { ok: false, error: '请稍后再试，60秒内只能发送一次' };
  }

  // 10分钟内最多3次
  const tenMin = await getEmailSendCount(email, 600);
  if (tenMin >= 3) {
    return { ok: false, error: '发送过于频繁，请10分钟后再试' };
  }

  // 同IP每小时最多10次
  if (ip !== 'unknown') {
    const hourByIP = await getIPSendCount(ip, 3600);
    if (hourByIP >= 10) {
      return { ok: false, error: '当前网络发送过于频繁，请稍后再试' };
    }
  }

  return { ok: true };
}

/** 发送验证码核心逻辑 */
async function sendCodeLogic(email: string, type: number, ip: string) {
  // 重置密码时检查邮箱是否已注册
  if (type === CODE_TYPE.RESET) {
    const exists = await checkUserExists(email);
    if (!exists) {
      return { ok: false, status: 400, error: '该邮箱未注册' };
    }
  }

  // 生成并保存验证码
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await saveCode(email, code, type, ip, expiresAt);

  // 发送邮件
  const result = await sendVerificationEmail(email, code, type as CodeType);
  if (!result.success) {
    return { ok: false, status: 500, error: result.error || '发送失败' };
  }

  return { ok: true };
}

// ============ 接口处理层 ============

export async function POST(request: Request) {
  try {
    const { email, type = CODE_TYPE.LOGIN } = await request.json();

    // 参数校验
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return Response.json({ error: emailValidation.message }, { status: 400 });
    }
    if (![CODE_TYPE.LOGIN, CODE_TYPE.RESET, CODE_TYPE.CHANGE_EMAIL].includes(type)) {
      return Response.json({ error: '无效的验证码类型' }, { status: 400 });
    }

    // 频率限制检查
    const ip = await getClientIP();
    const rateCheck = await checkRateLimit(email, ip);
    if (!rateCheck.ok) {
      return Response.json({ error: rateCheck.error }, { status: 429 });
    }

    // 发送验证码
    const result = await sendCodeLogic(email, type, ip);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }

    return Response.json({ success: true, message: '验证码已发送' });
  } catch (error) {
    console.error('[SendCode] Error:', error);
    return Response.json({ error: '发送失败，请稍后重试' }, { status: 500 });
  }
}
