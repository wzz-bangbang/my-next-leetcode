'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ProfileModal from './ProfileModal';
import { showLoginModal } from '@/lib/api';
import { StarFilledIcon } from '@/components/icons';
import { iconSize } from '@/styles/theme';

export default function LoginButton() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const isFavoritesActive = pathname === '/favorites';
  const isLoggedIn = status === 'authenticated' && session?.user;

  const handleLogout = async () => {
    setIsProfileModalOpen(false);
    await signOut({ redirect: false });
  };

  return (
    <>
      <div className="relative flex items-center gap-2">
        {/* 加载中：不显示任何内容 */}
        {status === 'loading' ? null : isLoggedIn ? (
          <>
            {/* 收藏按钮 - 渐变边框 */}
            <Link
              href="/favorites"
              data-active={isFavoritesActive}
              className={`btn-gradient-border btn-gradient-star flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                isFavoritesActive ? 'active' : ''
              }`}
            >
              <StarFilledIcon size={iconSize.sm} />
              <span>我的收藏</span>
            </Link>

            {/* 已登录：显示头像，点击弹出个人信息弹窗 */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {session?.user?.image ? (
                <img
                  src={session?.user?.image}
                  alt={session?.user?.name || '用户'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-white text-sm font-medium">
                  {session?.user?.name?.[0] || '?'}
                </div>
              )}
            </button>
          </>
        ) : (
          /* 未登录：显示登录按钮 - 渐变边框 */
          <button
            onClick={() => showLoginModal()}
            className="btn-gradient-border btn-gradient-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200"
          >
            登录
          </button>
        )}
      </div>

      {/* 个人信息弹窗 */}
      <ProfileModal
        opened={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        session={session}
        onLogout={handleLogout}
      />
    </>
  );
}
