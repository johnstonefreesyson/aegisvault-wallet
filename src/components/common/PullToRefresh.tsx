import React, { useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { haptic } from '../../utils/notify';

const THRESHOLD = 70;

/** Touch pull-to-refresh. Only active when the page is scrolled to the top. */
export const PullToRefresh: React.FC<{ onRefresh: () => Promise<unknown> | void; children: React.ReactNode }> = ({
  onRefresh,
  children,
}) => {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0 && !busy) startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPull(Math.min(dy * 0.5, 100));
    else setPull(0);
  };
  const onTouchEnd = async () => {
    if (startY.current === null) return;
    startY.current = null;
    if (pull >= THRESHOLD * 0.5) {
      haptic(12);
      setBusy(true);
      setPull(THRESHOLD * 0.5);
      try {
        await onRefresh();
      } finally {
        setBusy(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden text-muted transition-[height] duration-150"
        style={{ height: pull }}
        aria-hidden={pull === 0}
      >
        <RefreshCw
          size={18}
          className={busy ? 'animate-spin' : ''}
          style={{ transform: busy ? undefined : `rotate(${pull * 4}deg)`, opacity: Math.min(1, pull / 35) }}
        />
      </div>
      {children}
    </div>
  );
};
