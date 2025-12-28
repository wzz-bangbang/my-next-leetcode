'use client';

import { useEffect } from 'react';
import { preloadBaguData } from '@/lib/bagu-data';

// 预加载组件 - 在空闲时预加载八股数据
export default function Preloader() {
  useEffect(() => {
    preloadBaguData();
  }, []);

  return null;
}

