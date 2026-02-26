/**
 * API 请求封装工具
 * - 统一的请求方法封装
 * - 自动处理 JSON 序列化
 * - 统一的错误处理
 * - 401 未授权自动弹出登录提示
 */
// import { notifications } from '@mantine/notifications';

// 登录弹窗模式
export type LoginModalMode = 'password' | 'code' | 'resetPassword' | 'changeEmail' | 'changePassword';

// 全局登录弹窗方法
let _showLoginModal: ((mode?: LoginModalMode) => void) | null = null;

/**
 * 注册登录弹窗方法
 * 由 LoginModal 组件挂载时调用
 */
export function registerLoginModal(fn: ((mode?: LoginModalMode) => void) | null) {
  _showLoginModal = fn;
}

/**
 * 打开登录弹窗
 * 全局可用，任何地方都可以调用
 * @param mode 可选的初始模式
 */
export function showLoginModal(mode?: LoginModalMode) {
  _showLoginModal?.(mode);
}

// 请求配置
interface ApiRequestOptions {
  /** 是否在 401 时弹出登录提示，默认 true */
  showLoginOnUnauthorized?: boolean;
}

// 响应结果
export interface ApiResponse<T> {
  /** 是否成功 (status 2xx) */
  ok: boolean;
  /** HTTP 状态码 */
  status: number;
  /** 响应数据 */
  data: T | null;
  /** 错误信息 */
  error?: string;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * 核心请求方法
 */
async function request<T>(
  method: HttpMethod,
  url: string,
  body?: unknown,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { showLoginOnUnauthorized = true } = options;

  try {
    const fetchOptions: RequestInit = { method };
    
    // GET 和 DELETE 不需要 body
    if (body !== undefined && method !== 'GET' && method !== 'DELETE') {
      fetchOptions.headers = { 'Content-Type': 'application/json' };
      fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(url, fetchOptions);

    // 处理 401
    if (res.status === 401 && showLoginOnUnauthorized) {
      // notifications.show({
      //   title: '提示',
      //   message: '请先登录',
      //   color: 'yellow',
      //   autoClose: 2000,
      // });
      showLoginModal();
      return { ok: false, status: 401, data: null, error: '未登录' };
    }

    // 处理其他错误
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { ok: false, status: res.status, data: null, error: errorData.error || '请求失败' };
    }

    // 解析响应
    const data = await res.json().catch(() => null);
    return { ok: true, status: res.status, data };
  } catch (error) {
    console.error(`API ${method} error:`, error);
    return { ok: false, status: 0, data: null, error: '网络错误' };
  }
}

/** GET 请求 */
export function apiGet<T = unknown>(url: string, options?: ApiRequestOptions) {
  return request<T>('GET', url, undefined, options);
}

/** POST 请求 */
export function apiPost<T = unknown>(url: string, body?: unknown, options?: ApiRequestOptions) {
  return request<T>('POST', url, body, options);
}

/** PUT 请求 */
export function apiPut<T = unknown>(url: string, body?: unknown, options?: ApiRequestOptions) {
  return request<T>('PUT', url, body, options);
}

/** PATCH 请求 */
export function apiPatch<T = unknown>(url: string, body?: unknown, options?: ApiRequestOptions) {
  return request<T>('PATCH', url, body, options);
}

/** DELETE 请求 */
export function apiDelete<T = unknown>(url: string, options?: ApiRequestOptions) {
  return request<T>('DELETE', url, undefined, options);
}
