import { useEffect, useRef } from 'react';

/**
 * Locks the wallet after `minutes` of inactivity, and when the app is backgrounded
 * for longer than that (0 = lock as soon as the tab/app is hidden).
 */
export function useAutoLock(enabled: boolean, minutes: number, onLock: () => void) {
  const lockRef = useRef(onLock);
  lockRef.current = onLock;

  useEffect(() => {
    if (!enabled) return;
    const limitMs = Math.max(0, minutes) * 60_000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let hiddenAt: number | null = null;

    const arm = () => {
      if (timer) clearTimeout(timer);
      if (limitMs > 0) timer = setTimeout(() => lockRef.current(), limitMs);
    };

    const onActivity = () => arm();

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        if (limitMs === 0) lockRef.current();
      } else if (hiddenAt !== null) {
        const away = Date.now() - hiddenAt;
        hiddenAt = null;
        if (limitMs > 0 && away >= limitMs) lockRef.current();
        else arm();
      }
    };

    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisibility);
    arm();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, minutes]);
}
