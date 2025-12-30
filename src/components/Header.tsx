'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { preloadBaguData } from '@/lib/bagu-data';

export default function Header() {
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 预加载八股数据（不在八股页时）
  useEffect(() => {
    if (pathname !== '/bagu') {
      preloadBaguData();
    }
  }, [pathname]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const navItems = [
    { href: '/bagu', label: '📚 八股文', mobileLabel: '📚 八股' },
    { href: '/code-editor', label: '🚀 刷题', mobileLabel: '🚀 刷题' },
  ];

  const userMenuItems = [
    { icon: '⭐', label: '收藏清单', href: '/favorites' },
  ];

  return (
    <header className="relative z-20 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-white/20 backdrop-blur-sm bg-white/10">
      {/* Logo / 首页链接 + 导航链接 */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          href="/"
          className="text-base sm:text-lg font-bold whitespace-nowrap"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          求职指北
        </Link>

        {/* 分隔线 */}
        <div className="w-px h-4 sm:h-5 bg-gray-300" />

        {/* 导航链接 */}
        <nav className="flex gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/30'
                }`}
                style={
                  isActive
                    ? {
                        background: item.href === '/bagu'
                          ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }
                    : undefined
                }
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.mobileLabel}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 用户按钮 */}
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full bg-gradient-to-br from-sky-100 to-teal-100 flex items-center justify-center text-sky-600 text-xs sm:text-sm shadow-sm hover:shadow-md hover:from-sky-200 hover:to-teal-200 transition-all duration-200 border border-sky-200/50"
        >
          👤
        </button>

        {/* 用户菜单浮窗 */}
        {isUserMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

