import React, { useState } from 'react';
import { Lock, Shield, ArrowRight, AlertCircle, Trash2 } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';

export const UnlockScreen: React.FC = () => {
  const { walletName, unlockWallet, removeWallet, showToast } = useWallet();
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const success = await unlockWallet(passcode);
    if (!success) {
      setErrorMsg('Incorrect passcode. Please try again.');
      setIsSubmitting(false);
    } else {
      showToast('Wallet unlocked', 'success');
    }
  };

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

        {errorMsg && (
          <div className="mb-4 w-full p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-4">
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Enter passcode"
            className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-center font-mono text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-xs"
            required
            autoFocus
          />

          <button
            type="submit"
            disabled={isSubmitting || !passcode}
            className="w-full h-12 rounded-2xl bg-peach hover:bg-peach-hover disabled:opacity-50 text-ink font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-none"
          >
            {isSubmitting ? (
              <span>Verifying...</span>
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
