/**
 * 认证相关 API
 */
import { apiPost } from '@/lib/api';
import * as Sentry from '@sentry/nextjs';

/** 注册 */
export async function register(email: string, password: string, name: string) {
  const result = await apiPost<{ message: string }>('/api/auth/register', { email, password, name }, {
    showLoginOnUnauthorized: false,
  });
  
  // 注册失败时上报（排除已注册的情况 409）
  if (!result.ok && result.status !== 409) {
    Sentry.captureMessage('用户注册失败', {
      level: 'error',
      tags: { feature: 'auth', action: 'register' },
      extra: { email, error: result.error, status: result.status },
    });
  }
  
  return result;
}

/** 注销账号 */
export async function deactivateAccount() {
  const result = await apiPost<{ message: string }>('/api/auth/deactivate', undefined, {
    showLoginOnUnauthorized: false,
  });
  
  if (!result.ok) {
    Sentry.captureMessage('账号注销失败', {
      level: 'error',
      tags: { feature: 'auth', action: 'deactivate' },
      extra: { error: result.error, status: result.status },
    });
  }
  
  return result;
}

/**
 * 发送验证码
 * @param email 邮箱
 * @param type 类型：1=登录/注册，2=重置密码，3=换绑邮箱
 */
export async function sendCode(email: string, type: number = 1) {
  const result = await apiPost<{ message: string }>('/api/auth/send-code', { email, type }, {
    showLoginOnUnauthorized: false,
  });
  
  // 发送验证码失败时上报（排除频率限制 429）
  if (!result.ok && result.status !== 429) {
    Sentry.captureMessage('发送验证码失败', {
      level: 'error',
      tags: { feature: 'auth', action: 'send-code' },
      extra: { email, type, error: result.error, status: result.status },
    });
  }
  
  return result;
}

/** 重置密码 */
export async function resetPassword(email: string, code: string, newPassword: string) {
  const result = await apiPost<{ message: string }>('/api/auth/reset-password', { email, code, newPassword }, {
    showLoginOnUnauthorized: false,
  });
  
  // 重置密码失败时上报（排除验证码错误 400）
  if (!result.ok && result.status !== 400) {
    Sentry.captureMessage('重置密码失败', {
      level: 'error',
      tags: { feature: 'auth', action: 'reset-password' },
      extra: { email, error: result.error, status: result.status },
    });
  }
  
  return result;
}

/** 验证当前邮箱（换绑邮箱第一步） */
export async function verifyEmail(email: string, code: string) {
  return apiPost<{ message: string }>('/api/auth/verify-email', { email, code });
}

/** 换绑邮箱（换绑邮箱第二步） */
export async function changeEmail(newEmail: string, code: string) {
  const result = await apiPost<{ message: string }>('/api/auth/change-email', { newEmail, code });
  
  if (!result.ok && result.status !== 400 && result.status !== 409) {
    Sentry.captureMessage('换绑邮箱失败', {
      level: 'error',
      tags: { feature: 'auth', action: 'change-email' },
      extra: { newEmail, error: result.error, status: result.status },
    });
  }
  
  return result;
}

/** 修改密码 */
export async function changePassword(oldPassword: string, newPassword: string) {
  const result = await apiPost<{ message: string }>('/api/auth/change-password', { oldPassword, newPassword });
  
  // 修改密码失败时上报（排除原密码错误 401）
  if (!result.ok && result.status !== 401) {
    Sentry.captureMessage('修改密码失败', {
      level: 'error',
      tags: { feature: 'auth', action: 'change-password' },
      extra: { error: result.error, status: result.status },
    });
  }
  
  return result;
}
