'use client';

import LoginButton from '@/components/LoginButton';

// 首页登录按钮 - 只是定位包装器，复用公共 LoginButton 组件
// 定位和 Header 的 padding 保持一致：px-3 sm:px-6 py-3 sm:py-4
export default function HomeLoginButton() {
  return (
    <div className="absolute top-3 right-3 sm:top-4 sm:right-6 z-20">
      <LoginButton redirectUrl="/" />
    </div>
  );
}
