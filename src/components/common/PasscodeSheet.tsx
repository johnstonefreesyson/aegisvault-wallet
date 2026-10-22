import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { X, Lock } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { WalletManager } from '../../services/blockchain/walletManager';
import { KeyOrSigner } from '../../services/blockchain/signerSource';

interface PasscodeSheetProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onClose: () => void;
  /** Called with the decrypted private key of the active account. Throw to show an error. */
  onUnlocked: (signer: KeyOrSigner) => Promise<void>;
}

/** Bottom sheet that asks for the passcode, decrypts the active account key and hands it to the caller. */
export const PasscodeSheet: React.FC<PasscodeSheetProps> = ({ open, title, description, confirmLabel = 'Confirm', onClose, onUnlocked }) => {
  const { activeVault, activeAccount, activeAddress } = useWallet();
  const [passcode, setPasscode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setPasscode('');
      setError('');
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVault || busy) return;
    setBusy(true);
    setError('');
    try {
      const key = await WalletManager.unlockAccountKey(activeVault, activeAccount, passcode);
      if (new ethers.Wallet(key).address.toLowerCase() !== activeAddress.toLowerCase()) {
        throw new Error('Key does not match the active account. Switch account and try again.');
      }
      setPasscode('');
      await onUnlocked(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-ink flex items-center gap-2"><Lock size={16} /> {title}</h3>
            {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <input
          type="password"
          autoFocus
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Enter passcode"
          aria-label="Passcode"
          className="w-full px-4 py-3 rounded-2xl bg-card text-sm text-ink focus:outline-none focus:ring-1 focus:ring-coral/40"
        />
        {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
        <button type="submit" disabled={busy || passcode.length === 0} className="btn-primary !h-12 !rounded-2xl w-full disabled:opacity-50">
          {busy ? 'Working…' : confirmLabel}
        </button>
      </form>
    </div>
  );
};
