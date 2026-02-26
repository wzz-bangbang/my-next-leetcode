/**
 * 认证相关 API
 */
import { apiPost } from '@/lib/api';

/** 注册 */
export async function register(email: string, password: string, name: string) {
  return apiPost<{ message: string }>('/api/auth/register', { email, password, name }, {
    showLoginOnUnauthorized: false,
  });
}

/** 注销账号 */
export async function deactivateAccount() {
  return apiPost<{ message: string }>('/api/auth/deactivate', undefined, {
    showLoginOnUnauthorized: false,
  });
}

/**
 * 发送验证码
 * @param email 邮箱
 * @param type 类型：1=登录/注册，2=重置密码，3=换绑邮箱
 */
export async function sendCode(email: string, type: number = 1) {
  return apiPost<{ message: string }>('/api/auth/send-code', { email, type }, {
    showLoginOnUnauthorized: false,
  });
}

/** 重置密码 */
export async function resetPassword(email: string, code: string, newPassword: string) {
  return apiPost<{ message: string }>('/api/auth/reset-password', { email, code, newPassword }, {
    showLoginOnUnauthorized: false,
  });
}

/** 验证当前邮箱（换绑邮箱第一步） */
export async function verifyEmail(email: string, code: string) {
  return apiPost<{ message: string }>('/api/auth/verify-email', { email, code });
}

/** 换绑邮箱（换绑邮箱第二步） */
export async function changeEmail(newEmail: string, code: string) {
  return apiPost<{ message: string }>('/api/auth/change-email', { newEmail, code });
}

/** 修改密码 */
export async function changePassword(oldPassword: string, newPassword: string) {
  return apiPost<{ message: string }>('/api/auth/change-password', { oldPassword, newPassword });
}
