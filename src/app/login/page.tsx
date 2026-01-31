'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const provider = searchParams.get('provider') || 'github';
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    // 自动触发登录
    signIn(provider, { callbackUrl });
  }, [provider, callbackUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">正在跳转登录...</p>
      </div>
    </div>
  );
}
