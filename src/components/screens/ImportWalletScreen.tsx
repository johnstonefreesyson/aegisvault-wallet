import React, { useState } from 'react';
import { ChevronLeft, ShieldAlert, Clipboard } from 'lucide-react';
import { WalletManager } from '../../services/blockchain/walletManager';
import { useWallet } from '../../store/WalletContext';

export const ImportWalletScreen: React.FC = () => {
  const { setCurrentScreen, importWallet, showToast } = useWallet();

  const [importType, setImportType] = useState<'phrase' | 'private_key'>('phrase');
  const [walletName, setWalletName] = useState('Imported Wallet');
  const [secretInput, setSecretInput] = useState('');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSecretInput(text.trim());
        showToast('Pasted from clipboard', 'info');
      }
    } catch {
      showToast('Unable to read clipboard automatically. Please paste manually.', 'info');
    }
  };

  const handleClear = () => {
    setSecretInput('');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!walletName.trim()) {
      setErrorMsg('Please specify a wallet name.');
      return;
    }

    if (!secretInput.trim()) {
      setErrorMsg('Please provide your recovery phrase or private key.');
      return;
    }

    if (passcode.length < 6) {
      setErrorMsg('Security passcode must be at least 6 characters.');
      return;
    }

    if (passcode !== confirmPasscode) {
      setErrorMsg('Passcodes do not match.');
      return;
    }

    // Validation
    if (importType === 'phrase') {
      const val = WalletManager.validateMnemonic(secretInput);
      if (!val.isValid) {
        setErrorMsg(val.error || 'Invalid 12 or 24-word recovery phrase.');
        return;
      }
    } else {
      let cleanKey = secretInput.trim();
      if (!cleanKey.startsWith('0x')) cleanKey = '0x' + cleanKey;
      if (cleanKey.length !== 66) {
        setErrorMsg('Invalid EVM private key length. It must be 64 hex characters (32 bytes).');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await importWallet(walletName, secretInput, passcode);
      // Clean memory
      setSecretInput('');
      setPasscode('');
      setConfirmPasscode('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  const field = 'w-full px-4 py-3 rounded-2xl bg-card border border-transparent focus:border-coral/60 focus:outline-none text-sm text-ink placeholder-muted';

  return (
    <form onSubmit={handleSubmit} className="min-h-[100dvh] w-full page-wash flex flex-col md:px-10 lg:px-[10%] px-5 pt-5 pb-6">
      <div className="relative flex items-center justify-center h-10 mb-5">
        <button
          type="button"
          onClick={() => setCurrentScreen('welcome')}
          className="absolute left-0 p-2 -ml-2 text-ink/70 hover:text-ink"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="text-sm text-ink/80">Restore Wallet</span>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <ShieldAlert size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-1 p-1 bg-card rounded-2xl mb-4">
        {([['phrase', 'Mnemonic'], ['private_key', 'Private key']] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => { setImportType(k); setErrorMsg(''); }}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              importType === k ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <textarea
          rows={6}
          value={secretInput}
          onChange={(e) => setSecretInput(e.target.value)}
          placeholder={importType === 'phrase' ? 'Enter your mnemonic' : 'Enter your private key (0x…)'}
          className="w-full px-4 py-4 rounded-3xl bg-card border border-transparent focus:border-coral/60 focus:outline-none text-sm font-mono text-ink placeholder-muted placeholder:font-sans leading-relaxed resize-none"
          required
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={handlePaste}
          className="absolute right-3 bottom-3 text-[11px] text-coral hover:text-cyan-700 flex items-center gap-1 font-medium"
        >
          <Clipboard size={12} /> Paste
        </button>
      </div>

      <div className="space-y-3 mt-4">
        <input
          type="text"
          value={walletName}
          onChange={(e) => setWalletName(e.target.value)}
          placeholder="Wallet name"
          className={field}
          required
        />
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="New passcode (min. 6 characters)"
          className={field}
          required
        />
        <input
          type="password"
          value={confirmPasscode}
          onChange={(e) => setConfirmPasscode(e.target.value)}
          placeholder="Confirm passcode"
          className={field}
          required
        />
        <p className="text-[11px] text-muted px-1">
          Your phrase is encrypted on this device only. Derivation path <code>m/44'/60'/0'/0/0</code>.
        </p>
      </div>

      <div className="mt-auto pt-8 space-y-3">
        <button type="button" onClick={handleClear} className="btn-secondary w-full">Clear</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Restoring…' : 'Restore wallet'}
        </button>
      </div>
    </form>
  );
};
