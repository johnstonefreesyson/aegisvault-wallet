import { useEffect } from 'react';

export type ThemeSetting = 'light' | 'dark' | 'system';

/** Applies the `dark` class on <html> and keeps the browser theme-color in sync. */
export function useTheme(theme: ThemeSetting) {
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && !!mq?.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0e1420' : '#eef2fa');
    };
    apply();
    if (theme === 'system' && mq) {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme]);
}
