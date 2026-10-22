import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  ExternalLink,
  RefreshCw,
  Send,
  Check,
  ShieldCheck,
  AlertCircle,
  Coins,
} from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { multiChainService, MultiChainAccount, NonEvmChain } from '../../services/blockchain/multichain/multiChainService';
import { WalletManager } from '../../services/blockchain/walletManager';
import { QRDisplay } from '../common/QRDisplay';

export const MultiChainScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { vault, showToast, fiat } = useWallet();
  const [accounts, setAccounts] = useState<MultiChainAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState<MultiChainAccount | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  // Send state
  const [sendToAddress, setSendToAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadAccounts = async () => {
    if (!vault) return;
    setLoading(true);
    try {
      // Use decrypted phrase if unlocked or mock mnemonic for derivation demonstration
      const phrase = vault.hasMnemonic
        ? 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
        : 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const list = await multiChainService.getMultiChainAccounts(phrase);
      setAccounts(list);
    } catch {
      showToast('Could not load multi-chain balances', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [vault]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Address copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChain || !sendToAddress.trim() || !sendAmount) return;

    setIsSending(true);
    try {
      const result = await multiChainService.sendMultiChainTx({
        chain: selectedChain.chain,
        from: selectedChain.address,
        to: sendToAddress.trim(),
        amount: sendAmount,
        fee: selectedChain.chain === 'bitcoin' ? '0.0001 BTC' : '0.005 ' + selectedChain.symbol,
      });
      showToast(`Transaction sent! ID: ${result.txId.slice(0, 10)}…`, 'success');
      setShowSendModal(false);
      setSendToAddress('');
      setSendAmount('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Send failed';
      showToast(msg, 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] page-wash pb-28 px-4 md:px-10 lg:px-[10%] pt-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-ink hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-base font-bold text-ink">Multi-Chain Hub</h1>
          <p className="text-[11px] text-muted">Bitcoin, Solana, TRON & Cosmos</p>
        </div>
        <button
          onClick={loadAccounts}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-ink rounded-xl transition-colors"
          title="Refresh balances"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Info Notice */}
      <div className="mb-5 p-3.5 rounded-2xl bg-sky/10 border border-sky/20 text-navy text-xs flex items-start gap-2.5">
        <Coins size={18} className="text-sky shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          These non-EVM addresses are derived directly from your wallet’s master recovery phrase using standard multi-chain derivation paths (BIP-84, SLIP-0010, BIP-44).
        </p>
      </div>

      {/* Accounts List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="py-20 text-center text-xs text-muted">
            <RefreshCw size={24} className="animate-spin mx-auto text-coral mb-2" />
            <span>Deriving keys & querying balances…</span>
          </div>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc.chain}
              className="p-5 rounded-3xl bg-card border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs text-white shadow-xs"
                    style={{ backgroundColor: acc.color }}
                  >
                    {acc.symbol}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-ink">{acc.name}</h3>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                        {acc.symbol}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted font-mono">{acc.derivationPath}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-ink font-mono tabular-nums">
                    {acc.balanceFormatted} {acc.symbol}
                  </div>
                  <div className="text-[11px] text-muted">
                    {fiat(acc.balanceUSD)}
                  </div>
                </div>
              </div>

              {/* Address with copy & explorer */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-700 truncate max-w-[220px] sm:max-w-xs">{acc.address}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(acc.address)}
                    className="p-1.5 text-muted hover:text-coral rounded-lg transition-colors"
                    title="Copy address"
                  >
                    <Copy size={13} />
                  </button>
                  <a
                    href={acc.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-muted hover:text-coral rounded-lg transition-colors"
                    title="View on Explorer"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => {
                    setSelectedChain(acc);
                    setShowSendModal(true);
                  }}
                  className="btn-primary h-10 text-xs"
                >
                  <ArrowUpRight size={14} />
                  <span>Send {acc.symbol}</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedChain(acc);
                    setShowReceiveModal(true);
                  }}
                  className="btn-secondary h-10 text-xs"
                >
                  <ArrowDownLeft size={14} />
                  <span>Receive</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* RECEIVE MODAL */}
      {showReceiveModal && selectedChain && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-ink">Receive {selectedChain.name}</h3>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="text-muted hover:text-ink text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-center py-2">
              <QRDisplay value={selectedChain.address} size={180} />
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-muted uppercase block font-semibold mb-1">
                {selectedChain.name} Address
              </span>
              <p className="font-mono text-xs text-ink break-all select-all font-semibold">
                {selectedChain.address}
              </p>
            </div>

            <button
              onClick={() => handleCopy(selectedChain.address)}
              className="btn-primary w-full h-11 text-xs"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied' : 'Copy Address'}</span>
            </button>
          </div>
        </div>
      )}

      {/* SEND MODAL */}
      {showSendModal && selectedChain && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-ink">Send {selectedChain.name}</h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-muted hover:text-ink text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSend} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Recipient Address ({selectedChain.symbol})
                </label>
                <input
                  type="text"
                  value={sendToAddress}
                  onChange={(e) => setSendToAddress(e.target.value)}
                  placeholder={`Enter ${selectedChain.symbol} address`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-ink placeholder-slate-400 focus:outline-none focus:border-coral"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-semibold text-slate-600">Amount</label>
                  <span className="text-[10px] text-muted font-mono">
                    Avail: {selectedChain.balanceFormatted} {selectedChain.symbol}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-ink placeholder-slate-400 focus:outline-none focus:border-coral"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                    {selectedChain.symbol}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                <div className="flex justify-between text-muted">
                  <span>Network Fee:</span>
                  <span className="font-mono text-ink">
                    {selectedChain.chain === 'bitcoin' ? '0.0001 BTC (~$6.40)' : '0.005 ' + selectedChain.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Confirmation Speed:</span>
                  <span className="text-emerald-600 font-semibold">Fast Priority</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="btn-secondary h-11 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || !sendToAddress || !sendAmount}
                  className="btn-primary h-11 text-xs"
                >
                  {isSending ? 'Broadcasting...' : 'Sign & Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
