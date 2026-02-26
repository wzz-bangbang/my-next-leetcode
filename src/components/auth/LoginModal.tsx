'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { registerLoginModal, type LoginModalMode } from '@/lib/api';
import LoginForm from './forms/LoginForm';
import ResetPasswordForm from './forms/ResetPasswordForm';
import ChangeEmailForm from './forms/ChangeEmailForm';
import ChangePasswordForm from './forms/ChangePasswordForm';
import SocialLoginButtons from './SocialLoginButtons';

interface LoginModalProps {
  redirectUrl?: string;
}

export default function LoginModal({ redirectUrl = '/' }: LoginModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<LoginModalMode>('password');

  // 打开弹窗
  const open = useCallback((initialMode?: LoginModalMode) => {
    setMode(initialMode || 'password');
    setIsOpen(true);
  }, []);

  // 关闭弹窗
  const close = useCallback(() => {
    setIsOpen(false);
    setMode('password');
  }, []);

  // 客户端挂载后注册全局方法
  useEffect(() => {
    setMounted(true);
    registerLoginModal(open);
    return () => registerLoginModal(null);
  }, [open]);

  // 是否为已登录用户的操作模式
  const isAuthenticatedMode = mode === 'changeEmail' || mode === 'changePassword';

  // 渲染对应的表单
  const renderForm = () => {
    switch (mode) {
      case 'resetPassword':
        return (
          <ResetPasswordForm 
            onSuccess={() => setMode('password')} 
            onBack={() => setMode('password')} 
          />
        );
      case 'changeEmail':
        return <ChangeEmailForm onSuccess={close} />;
      case 'changePassword':
        return <ChangePasswordForm onSuccess={close} />;
      default:
        // password 和 code 模式都由 LoginForm 处理
        return (
          <LoginForm 
            onSuccess={close} 
            onModeChange={setMode} 
          />
        );
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
      />
      
      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-sm p-6 animate-in zoom-in-95 duration-200">
        {/* 关闭按钮 */}
        <button
          onClick={close}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>

        {/* 表单内容 */}
        {renderForm()}

        {/* 第三方登录（仅登录/注册模式） */}
        {!isAuthenticatedMode && mode !== 'resetPassword' && (
          <SocialLoginButtons redirectUrl={redirectUrl} />
        )}

        {/* 提示 */}
        <p className="text-xs text-gray-400 text-center mt-4">
          登录即表示同意我们的服务条款
        </p>
      </div>
    </div>,
    document.body
  );
}
