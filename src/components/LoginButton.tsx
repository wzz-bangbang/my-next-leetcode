'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

interface LoginButtonProps {
  redirectUrl?: string;
}

export default function LoginButton({ redirectUrl = '/' }: LoginButtonProps) {
  const { data: session, status } = useSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isLoggedIn = status === 'authenticated' && session?.user;

  // 客户端挂载后才能使用 Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await signOut({ redirect: false });
  };

  const handleGitHubLogin = () => {
    window.open('/login?provider=github&callbackUrl=' + encodeURIComponent(redirectUrl), '_blank');
    setIsLoginModalOpen(false);
  };

  const userMenuItems = [
    { icon: '⭐', label: '收藏清单', href: '/favorites' },
  ];

  return (
    <>
      <div className="relative">
        {isLoggedIn ? (
          <>
            {/* 已登录：显示头像 */}
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
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

            {/* 用户菜单浮窗 */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                {/* 用户信息 */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session?.user?.email}
                  </p>
                </div>
                
                {/* 菜单项 */}
                <div className="py-1">
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                  
                  {/* 退出登录 */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span>🚪</span>
                    <span>退出登录</span>
                  </button>
                </div>
              </div>
            )}
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
            onClick={() => setIsLoginModalOpen(false)}
          />
          
          {/* 弹窗内容 */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-sm p-6 animate-in zoom-in-95 duration-200">
            {/* 关闭按钮 */}
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>

            {/* 标题 */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">欢迎登录</h2>
              <p className="text-sm text-gray-500 mt-1">登录后可同步你的学习进度</p>
            </div>

            {/* 登录按钮 */}
            <div className="space-y-3">
              <button
                onClick={handleGitHubLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>使用 GitHub 登录</span>
              </button>
            </div>

            {/* 提示 */}
            <p className="text-xs text-gray-400 text-center mt-4">
              登录即表示同意我们的服务条款
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
