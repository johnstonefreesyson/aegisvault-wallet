import React, { useState } from 'react';
import { X, Check, Plus, QrCode, Pencil, Sparkles, Download, Layers, ChevronLeft, Copy, ShieldAlert } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { WalletManager } from '../../services/blockchain/walletManager';
import { haptic } from '../../utils/notify';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onShowAddress: () => void;
}

type Mode = 'list' | 'choose' | 'derive' | 'create' | 'import';

const field =
  'w-full px-4 py-3 rounded-2xl bg-card text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-coral/40';

export const AccountsModal: React.FC<Props> = ({ isOpen, onClose, onShowAddress }) => {
  const { accounts, activeAccount, activeVault, canAddAccount, addAccount, addWallet, switchAccount, renameAccount, showToast } =
    useWallet();
  const [mode, setMode] = useState<Mode>('list');
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [secret, setSecret] = useState('');
  const [importType, setImportType] = useState<'phrase' | 'private_key'>('phrase');
  const [newPhrase, setNewPhrase] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setMode('list');
    setName('');
    setPasscode('');
    setSecret('');
    setNewPhrase('');
    setSaved(false);
    setError('');
    setEditingId(null);
    setImportType('phrase');
  };
  const close = () => {
    reset();
    onClose();
  };
  const goto = (m: Mode) => {
    setError('');
    setPasscode('');
    setSecret('');
    setSaved(false);
    setName('');
    if (m === 'create') setNewPhrase(WalletManager.generateMnemonic());
    else setNewPhrase('');
    setMode(m);
  };

  const run = async (fn: () => Promise<void>) => {
    setError('');
    setBusy(true);
    try {
      await fn();
      haptic(15);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const submitDerive = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => addAccount(name, passcode));
  };

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saved) {
      setError('Please confirm you have saved the recovery phrase.');
      return;
    }
    run(() => addWallet({ mode: 'create', name, secret: newPhrase, passcode }));
  };

  const submitImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) {
      setError(importType === 'phrase' ? 'Enter your recovery phrase.' : 'Enter your private key.');
      return;
    }
    run(() => addWallet({ mode: 'import', name, secret, passcode }));
  };

  const copyPhrase = () => {
    navigator.clipboard?.writeText(newPhrase);
    showToast('Recovery phrase copied. Treat with care.', 'info');
  };

  const title =
    mode === 'choose' ? 'Add account' : mode === 'derive' ? 'New account' : mode === 'create' ? 'Create new wallet' : mode === 'import' ? 'Import wallet' : 'Accounts';

  const Err = () => (error ? <p role="alert" className="text-xs text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{error}</p> : null);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 min-w-0">
            {mode !== 'list' && (
              <button
                onClick={() => (mode === 'choose' ? goto('list') : goto('choose'))}
                aria-label="Back"
                className="p-1.5 -ml-1.5 text-muted hover:text-ink"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h3 className="text-base font-semibold text-ink truncate">{title}</h3>
          </div>
          <button onClick={close} aria-label="Close" className="p-1.5 -mr-1.5 text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {/* ───────── Account list ───────── */}
        {mode === 'list' && (
          <>
            <ul className="space-y-2">
              {accounts.map((a) => {
                const active = a.id === activeAccount?.id;
                return (
                  <li key={a.id} className={`rounded-2xl ${active ? 'bg-peach/40' : 'bg-card'}`}>
                    {editingId === a.id ? (
                      <form
                        className="flex items-center gap-2 p-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          renameAccount(a.id, editName);
                          setEditingId(null);
                        }}
                      >
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-ink focus:outline-none focus:border-coral/60"
                        />
                        <button type="submit" className="px-3 py-2 rounded-xl bg-peach text-ink text-xs font-semibold">Save</button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-1 pr-2">
                        <button
                          onClick={() => {
                            if (!active) switchAccount(a.id);
                            close();
                          }}
                          className="flex-1 flex items-center gap-3 p-3 text-left min-w-0"
                        >
                          <span className="w-9 h-9 rounded-full bg-navy text-white text-xs font-semibold flex items-center justify-center shrink-0">
                            {a.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm text-ink truncate">{a.name}</span>
                            <span className="block text-xs text-muted font-mono">{a.address.slice(0, 8)}…{a.address.slice(-6)}</span>
                          </span>
                          {active && <Check size={16} className="text-coral ml-auto shrink-0" />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(a.id);
                            setEditName(a.name);
                          }}
                          aria-label={`Rename ${a.name}`}
                          className="p-2 text-muted hover:text-ink"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => goto('choose')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-card text-sm text-ink hover:brightness-95"
              >
                <Plus size={16} /> Add account
              </button>
              <button
                onClick={() => {
                  close();
                  onShowAddress();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-card text-sm text-ink hover:brightness-95"
              >
                <QrCode size={16} /> Show address & QR
              </button>
            </div>
          </>
        )}

        {/* ───────── Choose how to add ───────── */}
        {mode === 'choose' && (
          <div className="space-y-2.5">
            <button
              onClick={() => goto('create')}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card hover:brightness-95 text-left"
            >
              <span className="w-10 h-10 rounded-full bg-peach flex items-center justify-center shrink-0 text-ink"><Sparkles size={18} /></span>
              <span>
                <span className="block text-sm font-semibold text-ink">Create new wallet</span>
                <span className="block text-xs text-muted">A fresh wallet with its own recovery phrase</span>
              </span>
            </button>
            <button
              onClick={() => goto('import')}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card hover:brightness-95 text-left"
            >
              <span className="w-10 h-10 rounded-full bg-sky/20 flex items-center justify-center shrink-0 text-navy"><Download size={18} /></span>
              <span>
                <span className="block text-sm font-semibold text-ink">Import wallet</span>
                <span className="block text-xs text-muted">Use a recovery phrase or private key</span>
              </span>
            </button>
            <button
              onClick={() => goto('derive')}
              disabled={!canAddAccount}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card hover:brightness-95 text-left disabled:opacity-50"
            >
              <span className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-navy"><Layers size={18} /></span>
              <span>
                <span className="block text-sm font-semibold text-ink">Another account in {activeVault?.name || 'this wallet'}</span>
                <span className="block text-xs text-muted">
                  {canAddAccount ? 'Same recovery phrase, new address' : 'Not available: this wallet was imported with a private key'}
                </span>
              </span>
            </button>
          </div>
        )}

        {/* ───────── Derive another account ───────── */}
        {mode === 'derive' && (
          <form onSubmit={submitDerive} className="space-y-3">
            <Err />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Account ${accounts.length + 1}`} className={field} />
            <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Your passcode" required className={field} />
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => goto('choose')} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Deriving…' : 'Add'}</button>
            </div>
          </form>
        )}

        {/* ───────── Create a new wallet ───────── */}
        {mode === 'create' && (
          <form onSubmit={submitCreate} className="space-y-3">
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex gap-2">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <p className="leading-relaxed">Write these 12 words down in order and keep them offline. Anyone with them controls this wallet, and we cannot recover them for you.</p>
            </div>
            <div className="p-3 rounded-2xl bg-card">
              <div className="grid grid-cols-3 gap-2">
                {newPhrase.split(' ').map((w, i) => (
                  <div key={i} className="px-2 py-1.5 rounded-xl bg-white border border-slate-200/90 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 w-4 text-right">{i + 1}.</span>
                    <span className="text-xs font-mono font-bold text-slate-800 truncate">{w}</span>
                  </div>
                ))}
              </div>
              <button type="button" onClick={copyPhrase} className="mt-3 text-xs font-semibold text-coral flex items-center gap-1.5 ml-auto">
                <Copy size={13} /> Copy phrase
              </button>
            </div>
            <label className="flex items-start gap-2.5 text-xs text-ink cursor-pointer">
              <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-0.5 accent-[#f4693f]" />
              I have written down my recovery phrase and stored it safely.
            </label>
            <Err />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Wallet ${accounts.length + 1}`} className={field} />
            <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Your passcode" required className={field} />
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => goto('choose')} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Creating…' : 'Create'}</button>
            </div>
          </form>
        )}

        {/* ───────── Import a wallet ───────── */}
        {mode === 'import' && (
          <form onSubmit={submitImport} className="space-y-3">
            <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-card">
              {(['phrase', 'private_key'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setImportType(t);
                    setSecret('');
                    setError('');
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold transition ${importType === t ? 'bg-peach text-ink' : 'text-muted'}`}
                >
                  {t === 'phrase' ? 'Recovery phrase' : 'Private key'}
                </button>
              ))}
            </div>
            {importType === 'phrase' ? (
              <textarea
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter your 12 or 24 word recovery phrase"
                rows={3}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                className={`${field} resize-none font-mono`}
              />
            ) : (
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Private key (64 hex characters)"
                autoComplete="off"
                className={`${field} font-mono`}
              />
            )}
            <Err />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Imported Wallet" className={field} />
            <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Your passcode" required className={field} />
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => goto('choose')} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Importing…' : 'Import'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
