'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: '/bagu', label: '📚 八股文' },
    { href: '/code-editor', label: '🚀 刷题' },
  ];

  return (
    <header className="relative z-20 px-6 py-4 flex items-center border-b border-white/20 backdrop-blur-sm bg-white/10">
      {/* Logo / 首页链接 + 导航链接 */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-lg font-bold"
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
        <div className="w-px h-5 bg-gray-300" />

        {/* 导航链接 */}
        <nav className="flex gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
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
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

