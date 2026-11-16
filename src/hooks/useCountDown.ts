import { useEffect, useRef, useState } from 'react';

/**
 * Animates a displayed figure to `target` over `durationMs` (o-home-live-after:
 * the balance and "Left today" count down 400 ms after a write). The first
 * value shows immediately; later changes animate.
 */
export function useCountDown(target: number | null, durationMs = 400): number | null {
  const [value, setValue] = useState<number | null>(target);
  const from = useRef<number | null>(target);
  useEffect(() => {
    if (target === null) { setValue(null); from.current = null; return; }
    const start = from.current;
    if (start === null || start === target) { setValue(target); from.current = target; return; }
    const t0 = Date.now();
    let frame = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / durationMs);
      const eased = 1 - (1 - p) * (1 - p);
      const v = Math.round((start + (target - start) * eased) * 100) / 100;
      setValue(v);
      if (p < 1) frame = requestAnimationFrame(tick);
      else from.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); from.current = target; };
  }, [target, durationMs]);
  return value;
}
