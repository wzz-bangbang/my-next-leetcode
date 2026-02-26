/**
 * 该页面暂时保留，目前未使用
 * 原设计：用于新窗口打开后自动触发 OAuth 登录
 * 现设计：直接在当前页面调用 signIn() 跳转
 */

'use client';

// import { useEffect } from 'react';
// import { signIn } from 'next-auth/react';
// import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  // const searchParams = useSearchParams();
  // const provider = searchParams.get('provider') || 'github';
  // const callbackUrl = searchParams.get('callbackUrl') || '/';

  // useEffect(() => {
  //   // 自动触发登录
  //   signIn(provider, { callbackUrl });
  // }, [provider, callbackUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="text-center">
        <p className="text-gray-600">此页面暂未启用</p>
      </div>
    </div>
  );
}
