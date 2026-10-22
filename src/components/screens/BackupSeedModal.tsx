import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, Lock, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { WalletManager } from '../../services/blockchain/walletManager';

interface BackupSeedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupSeedModal: React.FC<BackupSeedModalProps> = ({ isOpen, onClose }) => {
  const { activeVault, activeAccount, accounts, showToast } = useWallet();
  const [passcode, setPasscode] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Never carry a revealed phrase over to a different wallet.
  useEffect(() => {
    setPasscode('');
    setMnemonic('');
    setIsRevealed(false);
    setErrorMsg('');
    setCopied(false);
  }, [activeVault?.id, isOpen]);

  if (!isOpen) return null;

  const walletLabel = activeVault?.name || activeAccount?.name || 'Wallet';
  const hasPhrase = !!activeVault?.hasMnemonic && !!activeVault?.encryptedMnemonic;
  const siblingCount = accounts.filter((a) => a.vaultId === activeAccount?.vaultId).length;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVault) return;
    setErrorMsg('');
    setIsUnlocking(true);

    try {
      const phrase = await WalletManager.unlockMnemonic(activeVault, passcode);
      setMnemonic(phrase);
      setIsRevealed(true);
      showToast('Vault decrypted successfully', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Incorrect passcode';
      setErrorMsg(msg);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleCopy = () => {
    if (!mnemonic) return;
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    showToast('Recovery phrase copied. Treat with care.', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setPasscode('');
    setMnemonic('');
    setIsRevealed(false);
    setErrorMsg('');
    onClose();
  };

  const words = mnemonic ? mnemonic.split(' ') : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-md p-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Backup Recovery Phrase</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 px-3.5 py-2.5 rounded-2xl bg-card text-xs text-ink">
          <span className="text-muted">Wallet: </span>
          <span className="font-semibold">{walletLabel}</span>
          <span className="block text-muted font-mono mt-0.5">
            {activeVault?.address.slice(0, 8)}…{activeVault?.address.slice(-6)}
          </span>
          {hasPhrase && siblingCount > 1 && (
            <span className="block text-muted mt-1.5 leading-relaxed">
              This phrase also backs the other {siblingCount - 1} account{siblingCount > 2 ? 's' : ''} created inside this wallet.
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {!hasPhrase ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-xs leading-relaxed">
              <b>{walletLabel}</b> was imported with a private key, so it has no recovery phrase. Keep a safe copy of the private key you imported.
            </div>
            <button onClick={handleClose} className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors">
              Close
            </button>
          </div>
        ) : !isRevealed ? (
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
              <p className="leading-relaxed">
                Make sure no one is looking at your screen and no recording software or mirror displays are active.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Enter Security Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode to reveal"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-xs"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isUnlocking}
              className="w-full py-3 rounded-xl bg-peach hover:bg-peach-hover disabled:opacity-50 text-ink text-xs font-bold transition-all shadow-md shadow-none"
            >
              {isUnlocking ? 'Decrypting Vault...' : 'Reveal Recovery Phrase'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <ShieldAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Do NOT screenshot or save in plain digital text. Anyone with these words can steal your crypto.
              </p>
            </div>

            {/* 12-Word Grid */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
              <div className="grid grid-cols-3 gap-2">
                {words.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white border border-slate-200/90 flex items-center gap-1.5"
                  >
                    <span className="text-[10px] font-mono text-slate-400 w-4 text-right">
                      {idx + 1}.
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800 truncate">{w}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 flex justify-end">
                <button
                  onClick={handleCopy}
                  className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1.5"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Phrase'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              I Have Stored It Securely
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
