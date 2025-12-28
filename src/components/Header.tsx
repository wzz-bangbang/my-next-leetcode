'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { preloadBaguData } from '@/lib/bagu-data';

export default function Header() {
  const pathname = usePathname();

  // 预加载八股数据（不在八股页时）
  useEffect(() => {
    if (pathname !== '/bagu') {
      preloadBaguData();
    }
  }, [pathname]);

  const navItems = [
    { href: '/bagu', label: '📚 八股文', mobileLabel: '📚 八股' },
    { href: '/code-editor', label: '🚀 刷题', mobileLabel: '🚀 刷题' },
  ];

  return (
    <header className="relative z-20 px-3 sm:px-6 py-3 sm:py-4 flex items-center border-b border-white/20 backdrop-blur-sm bg-white/10">
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
    </header>
  );
}

