/**
 * 认证相关 API
 */
import { apiPost } from '@/lib/api';

/** 注册 */
export async function register(email: string, password: string, name: string) {
  return apiPost<{ message: string }>('/api/auth/register', { email, password, name }, {
    showLoginOnUnauthorized: false, // 注册不需要登录提示
  });
}

/** 注销账号 */
export async function deactivateAccount() {
  return apiPost<{ message: string }>('/api/auth/deactivate', undefined, {
    showLoginOnUnauthorized: false, // 已登录才能操作
  });
}
