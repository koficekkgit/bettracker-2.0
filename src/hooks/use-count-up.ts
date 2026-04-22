'use client';

import { useState, useEffect, useRef } from 'react';

export function useCountUp(target: number, duration = 1000, delay = 0): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setValue(0);
    clearTimeout(timerRef.current);
    cancelAnimationFrame(frameRef.current!);

    timerRef.current = setTimeout(() => {
      let startTime: number | null = null;

      function tick(ts: number) {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(target * eased);
        if (progress < 1) {
          frameRef.current = requestAnimationFrame(tick);
        } else {
          setValue(target);
        }
      }

      frameRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timerRef.current);
      cancelAnimationFrame(frameRef.current!);
    };
  }, [target, duration, delay]);

  return value;
}
