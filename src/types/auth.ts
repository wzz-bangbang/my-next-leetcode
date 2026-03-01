/**
 * 认证相关类型定义
 */

/** 验证码类型 */
export enum CodeType {
  LOGIN = 1,        // 登录/注册
  RESET = 2,        // 重置密码
  CHANGE_EMAIL = 3, // 换绑邮箱
}

/** 验证码记录（数据库） */
export interface VerificationCode {
  id: number;
  email: string;
  code: string;
  type: CodeType;
  verify_attempts: number;
  locked_until: Date | null;
  expires_at: Date;
  used: number;
}

/** 验证码验证结果 */
export interface VerifyCodeResult {
  ok: boolean;
  status?: number;
  error?: string;
  codeId: number | null;
}

/** 用户基础信息（数据库） */
export interface UserRow {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  password_hash: string | null;
  status: number | null;
}

/** 用户进度记录 */
export interface ProgressRow {
  question_id: number;
  status: number;
  is_favorite: number;
}

/** API 通用响应 */
export interface ApiResult<T = void> {
  ok: boolean;
  status?: number;
  error?: string;
  data?: T;
}
