import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, AlertCircle, Trash2, Clock, ShieldAlert } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { unlockThrottle } from '../../services/storage/unlockThrottle';

export const UnlockScreen: React.FC = () => {
  const { walletName, unlockWallet, removeWallet, showToast } = useWallet();
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [throttleState, setThrottleState] = useState(() => unlockThrottle.getThrottleState());
  const [countdown, setCountdown] = useState(throttleState.remainingSeconds);

  useEffect(() => {
    setCountdown(throttleState.remainingSeconds);
  }, [throttleState.remainingSeconds]);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setThrottleState(unlockThrottle.getThrottleState());
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countdown > 0) return;

    setErrorMsg('');
    setIsSubmitting(true);

    const success = await unlockWallet(passcode);
    if (!success) {
      const newThrottle = unlockThrottle.recordFailedAttempt();
      setThrottleState(newThrottle);
      setCountdown(newThrottle.remainingSeconds);

      if (newThrottle.isLocked) {
        setErrorMsg(`Too many failed attempts. Unlock is locked for ${newThrottle.remainingSeconds} seconds.`);
      } else {
        setErrorMsg(`Incorrect passcode. (${newThrottle.attempts} failed attempt${newThrottle.attempts > 1 ? 's' : ''})`);
      }
      setIsSubmitting(false);
    } else {
      unlockThrottle.recordSuccessfulUnlock();
      showToast('Wallet unlocked', 'success');
    }
  };

  const isLockedOut = countdown > 0;

  return (
    <div className="min-h-[100dvh] page-wash flex flex-col justify-between p-6 md:px-10 lg:px-[10%]">
      <div className="flex flex-col items-center text-center my-auto py-8">
        <div className="w-18 h-18 rounded-3xl bg-peach p-0.5 shadow-md shadow-none mb-5">
          <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
            <Lock size={32} className="text-cyan-600" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
          Unlock {walletName}
        </h2>
        <p className="text-xs text-slate-500 max-w-xs mb-6">
          Enter your security passcode to decrypt local wallet keys.
        </p>

        {isLockedOut ? (
          <div className="mb-4 w-full max-w-xs p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900">
              <Clock size={16} className="animate-spin text-amber-600" />
              <span>Unlock Throttled</span>
            </div>
            <p className="text-[11px] text-amber-700">
              Wait <span className="font-mono font-bold text-amber-900 text-sm">{countdown}s</span> before retrying to prevent brute-force attacks.
            </p>
          </div>
        ) : errorMsg ? (
          <div className="mb-4 w-full max-w-xs p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        {throttleState.warningLevel === 'danger' && !isLockedOut && (
          <div className="mb-4 w-full max-w-xs p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-[11px] flex items-center gap-2">
            <ShieldAlert size={14} className="shrink-0 text-rose-600" />
            <span>Warning: Repeated incorrect passcodes will exponentially increase lock times.</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-4">
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder={isLockedOut ? `Cooldown active (${countdown}s)` : 'Enter passcode'}
            disabled={isLockedOut || isSubmitting}
            className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-center font-mono text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-xs disabled:opacity-50 disabled:bg-slate-100"
            required
            autoFocus
          />

          <button
            type="submit"
            disabled={isSubmitting || !passcode || isLockedOut}
            className="w-full h-12 rounded-2xl bg-peach hover:bg-peach-hover disabled:opacity-50 text-ink font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-none cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span>Verifying...</span>
            ) : isLockedOut ? (
              <span>Locked for {countdown}s</span>
            ) : (
              <>
                <span>Unlock Wallet</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="text-center pb-4">
        <button
          onClick={removeWallet}
          className="text-xs text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1.5 mx-auto font-medium"
        >
          <Trash2 size={13} />
          <span>Reset or restore different wallet</span>
        </button>
      </div>
    </div>
  );
};
