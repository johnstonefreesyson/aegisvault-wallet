/**
 * Unlock throttling service to prevent offline / local brute force attempts.
 * Implements exponential back-off delays and warning thresholds.
 */

const STORAGE_KEY = 'aegisvault_unlock_throttle';

export interface ThrottleState {
  attempts: number;
  lockedUntil: number | null; // epoch ms
  isLocked: boolean;
  remainingSeconds: number;
  warningLevel: 'none' | 'warning' | 'danger';
}

let memoryStore: { attempts: number; lockedUntil: number } = { attempts: 0, lockedUntil: 0 };

function getStoredData(): { attempts: number; lockedUntil: number } {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // fallback to memoryStore
  }
  return memoryStore;
}

function saveStoredData(data: { attempts: number; lockedUntil: number }) {
  memoryStore = { ...data };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // ignore
  }
}

export const unlockThrottle = {
  getThrottleState(): ThrottleState {
    const data = getStoredData();
    const now = Date.now();
    const isLocked = data.lockedUntil > now;
    const remainingSeconds = isLocked ? Math.ceil((data.lockedUntil - now) / 1000) : 0;

    let warningLevel: 'none' | 'warning' | 'danger' = 'none';
    if (data.attempts >= 8) {
      warningLevel = 'danger';
    } else if (data.attempts >= 3) {
      warningLevel = 'warning';
    }

    return {
      attempts: data.attempts,
      lockedUntil: isLocked ? data.lockedUntil : null,
      isLocked,
      remainingSeconds,
      warningLevel,
    };
  },

  recordFailedAttempt(): ThrottleState {
    const data = getStoredData();
    const newAttempts = data.attempts + 1;
    let delaySeconds = 0;

    // Exponential cooldown schedule:
    // 1-2 attempts: no delay
    // 3-4 attempts: 15 seconds
    // 5-7 attempts: 60 seconds (1 minute)
    // 8-9 attempts: 300 seconds (5 minutes)
    // 10+ attempts: 900 seconds (15 minutes)
    if (newAttempts >= 10) {
      delaySeconds = 900;
    } else if (newAttempts >= 8) {
      delaySeconds = 300;
    } else if (newAttempts >= 5) {
      delaySeconds = 60;
    } else if (newAttempts >= 3) {
      delaySeconds = 15;
    }

    const lockedUntil = delaySeconds > 0 ? Date.now() + delaySeconds * 1000 : 0;
    saveStoredData({ attempts: newAttempts, lockedUntil });

    return {
      attempts: newAttempts,
      lockedUntil: lockedUntil > 0 ? lockedUntil : null,
      isLocked: delaySeconds > 0,
      remainingSeconds: delaySeconds,
      warningLevel: newAttempts >= 8 ? 'danger' : newAttempts >= 3 ? 'warning' : 'none',
    };
  },

  recordSuccessfulUnlock() {
    saveStoredData({ attempts: 0, lockedUntil: 0 });
  },

  reset() {
    saveStoredData({ attempts: 0, lockedUntil: 0 });
  },
};
