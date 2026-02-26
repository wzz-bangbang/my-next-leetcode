import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 倒计时 Hook
 * 基于时间戳实现，避免 setInterval 累积误差
 */
export function useCountdown(initialSeconds: number = 60) {
  const [countdown, setCountdown] = useState(0);
  const endTimeRef = useRef<number>(0);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        setCountdown(0);
        clearInterval(timer);
      } else {
        setCountdown(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown > 0]);

  const start = useCallback((seconds: number = initialSeconds) => {
    endTimeRef.current = Date.now() + seconds * 1000;
    setCountdown(seconds);
  }, [initialSeconds]);

  const reset = useCallback(() => {
    setCountdown(0);
  }, []);

  return {
    countdown,
    isActive: countdown > 0,
    start,
    reset,
  };
}
