/** Browser notifications + haptics helpers. Everything degrades silently when unsupported. */

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'default';
  }
}

/** Shows a system notification when permitted and the page isn't focused. Returns true if shown. */
export function systemNotify(title: string, body: string): boolean {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  if (typeof document !== 'undefined' && document.visibilityState === 'visible' && document.hasFocus()) return false;
  try {
    new Notification(title, { body, icon: '/logo.png' });
    return true;
  } catch {
    return false;
  }
}

export function haptic(ms: number | number[] = 10): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}
