import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

// 验证码类型
export const CODE_TYPE = {
  LOGIN: 1, // 登录/注册
  RESET: 2, // 重置密码
  CHANGE_EMAIL: 3, // 换绑邮箱
} as const;

export type CodeType = (typeof CODE_TYPE)[keyof typeof CODE_TYPE];

// 生成6位随机验证码
export function generateCode(): string {
  return Math.random().toString().slice(2, 8).padStart(6, '0');
}

// 发送验证码邮件
export async function sendVerificationEmail(
  email: string,
  code: string,
  type: CodeType,
): Promise<{ success: boolean; error?: string }> {
  const getSubjectAndAction = () => {
    switch (type) {
      case CODE_TYPE.LOGIN:
        // todo 改名字
        return { subject: '【前端练习】登录验证码', action: '登录' };
      case CODE_TYPE.RESET:
        return { subject: '【前端练习】重置密码验证码', action: '重置密码' };
      case CODE_TYPE.CHANGE_EMAIL:
        return { subject: '【前端练习】换绑邮箱验证码', action: '换绑邮箱' };
      default:
        return { subject: '【前端练习】验证码', action: '验证' };
    }
  };

  const { subject, action: actionText } = getSubjectAndAction();

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
          <h2 style="margin: 0 0 24px; color: #111827; font-size: 20px;">验证码</h2>
          <p style="margin: 0 0 16px; color: #4b5563; font-size: 14px;">您正在进行${actionText}操作，验证码如下：</p>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 16px;">
            <span style="font-size: 36px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; font-family: monospace;">
              ${code}
            </span>
          </div>
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            验证码 5 分钟内有效，请勿泄露给他人。<br/>
            如非本人操作，请忽略此邮件。
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[Email] Send failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[Email] Exception:', err);
    return { success: false, error: '邮件发送失败，请稍后重试' };
  }
}
