'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSession, signOut, signIn } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { TextInput, PasswordInput, Button, Divider, Alert } from '@mantine/core';
import { validateLoginForm, validateRegisterForm } from '@/lib/validation';
import ProfileModal from './ProfileModal';

interface LoginButtonProps {
  redirectUrl?: string;
}

export default function LoginButton({ redirectUrl = '/' }: LoginButtonProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const isFavoritesActive = pathname === '/favorites';
  
  // 表单状态
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 字段错误状态
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const isLoggedIn = status === 'authenticated' && session?.user;

  // 客户端挂载后才能使用 Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // 重置表单
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');
    setIsRegisterMode(false);
  };
  
  // 清除所有错误
  const clearErrors = () => {
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');
  };

  const handleLogout = async () => {
    setIsProfileModalOpen(false);
    await signOut({ redirect: false });
  };

  const handleGitHubLogin = () => {
    window.open('/login?provider=github&callbackUrl=' + encodeURIComponent(redirectUrl), '_blank');
    setIsLoginModalOpen(false);
  };

  const handleGoogleLogin = () => {
    window.open('/login?provider=google&callbackUrl=' + encodeURIComponent(redirectUrl), '_blank');
    setIsLoginModalOpen(false);
  };

  // 邮箱密码登录
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    // 前端校验
    const validation = validateLoginForm(email, password);
    setEmailError(validation.emailError);
    setPasswordError(validation.passwordError);
    if (!validation.isValid) return;

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setGeneralError('邮箱或密码错误');
      } else {
        setIsLoginModalOpen(false);
        resetForm();
      }
    } catch {
      setGeneralError('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    // 前端校验
    const validation = validateRegisterForm(email, password, confirmPassword);
    setEmailError(validation.emailError);
    setPasswordError(validation.passwordError);
    setConfirmPasswordError(validation.confirmPasswordError);
    if (!validation.isValid) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 根据错误类型显示在对应字段
        if (data.error?.includes('邮箱')) {
          setEmailError(data.error);
        } else if (data.error?.includes('密码')) {
          setPasswordError(data.error);
        } else {
          setGeneralError(data.error || '注册失败');
        }
        return;
      }

      // 注册成功，自动登录
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setGeneralError('注册成功，但自动登录失败，请手动登录');
      } else {
        setIsLoginModalOpen(false);
        resetForm();
      }
    } catch {
      setGeneralError('注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative flex items-center gap-2">
        {/* 加载中：不显示任何内容 */}
        {status === 'loading' ? null : isLoggedIn ? (
          <>
            {/* 收藏按钮 - 头像左侧 */}
            <Link
              href="/favorites"
              className={`flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                isFavoritesActive
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 bg-white/30 hover:bg-white/50'
              }`}
              style={
                isFavoritesActive
                  ? { background: 'linear-gradient(135deg, #f9e866 0%, #f6d365 100%)' }
                  : undefined
              }
            >
              <span className="hidden sm:inline">⭐</span>
              <span>收藏</span>
            </Link>

            {/* 已登录：显示头像，点击直接弹出弹窗 */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              {session?.user?.image ? (
                <img
                  src={session?.user?.image}
                  alt={session?.user?.name || '用户'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-medium">
                  {session?.user?.name?.[0] || '?'}
                </div>
              )}
            </button>
          </>
        ) : (
          /* 未登录：显示登录按钮 */
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-br from-sky-100 to-teal-100 text-sky-700 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md hover:from-sky-200 hover:to-teal-200 transition-all duration-200 border border-sky-200/50"
          >
            登录
          </button>
        )}
      </div>

      {/* 登录弹窗 - 使用 Portal 渲染到 body，避免受父元素 backdrop-blur 影响 */}
      {mounted && isLoginModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 遮罩层 */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsLoginModalOpen(false);
              resetForm();
            }}
          />
          
          {/* 弹窗内容 */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-sm p-6 animate-in zoom-in-95 duration-200">
            {/* 关闭按钮 */}
            <button
              onClick={() => {
                setIsLoginModalOpen(false);
                resetForm();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>

            {/* 标题 */}
            <div className="text-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                {isRegisterMode ? '创建账号' : '欢迎登录'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isRegisterMode ? '注册后可同步你的学习进度' : '登录后可同步你的学习进度'}
              </p>
            </div>

            {/* 通用错误提示 */}
            {generalError && (
              <Alert color="red" variant="light" mb="md">
                {generalError}
              </Alert>
            )}

            {/* 邮箱密码表单 */}
            <form onSubmit={isRegisterMode ? handleRegister : handleEmailLogin} noValidate>
              <div className="space-y-3">
                {/* 注册时显示昵称 */}
                {isRegisterMode && (
                  <TextInput
                    placeholder="昵称（选填）"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    radius="md"
                    size="md"
                  />
                )}
                
                <TextInput
                  placeholder="邮箱"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  error={emailError}
                  radius="md"
                  size="md"
                />
                
                <PasswordInput
                  placeholder={isRegisterMode ? '密码（8-14位，含大小写+数字+符号三种）' : '密码（8-14位）'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  error={passwordError}
                  radius="md"
                  size="md"
                />

                {/* 注册时显示确认密码 */}
                {isRegisterMode && (
                  <PasswordInput
                    placeholder="确认密码"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setConfirmPasswordError('');
                    }}
                    error={confirmPasswordError}
                    radius="md"
                    size="md"
                  />
                )}

                {/* 登录按钮 */}
                <Button
                  type="submit"
                  loading={isLoading}
                  fullWidth
                  radius="md"
                  size="md"
                  variant="light"
                  color="cyan"
                  className="!bg-gradient-to-r !from-sky-100 !to-teal-100 !text-sky-700 hover:!from-sky-200 hover:!to-teal-200 !border !border-sky-200/50"
                >
                  {isRegisterMode ? '注册' : '登录'}
                </Button>

                {/* 切换登录/注册 */}
                <Button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    clearErrors();
                  }}
                  fullWidth
                  radius="md"
                  size="md"
                  variant="light"
                  color="grape"
                  className="!bg-gradient-to-r !from-purple-50 !to-pink-50 !text-purple-600 hover:!from-purple-100 hover:!to-pink-100 !border !border-purple-200/50"
                >
                  {isRegisterMode ? '已有账号？去登录' : '没有账号？去注册'}
                </Button>
              </div>
            </form>

            {/* 分割线 */}
            <Divider label="或" labelPosition="center" my="md" />

            {/* 第三方登录按钮 */}
            <div className="space-y-2">
              {/* Google 登录 */}
              <Button
                onClick={handleGoogleLogin}
                fullWidth
                radius="md"
                size="md"
                variant="outline"
                color="gray"
                leftSection={
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                }
              >
                Google 登录
              </Button>

              {/* GitHub 登录 */}
              <Button
                onClick={handleGitHubLogin}
                fullWidth
                radius="md"
                size="md"
                color="dark"
                leftSection={
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                }
              >
                GitHub 登录
              </Button>
            </div>

            {/* 提示 */}
            <p className="text-xs text-gray-400 text-center mt-4">
              登录即表示同意我们的服务条款
            </p>
          </div>
        </div>,
        document.body
      )}

      {/* 我的弹窗 */}
      <ProfileModal
        opened={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        session={session}
        onLogout={handleLogout}
      />
    </>
  );
}
