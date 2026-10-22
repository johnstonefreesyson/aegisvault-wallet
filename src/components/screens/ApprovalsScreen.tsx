import React, { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { ShieldAlert, RefreshCw, ExternalLink } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { DEFAULT_TOKENS } from '../../config/networks';
import { secureStorage } from '../../services/storage/secureStorage';
import { ApprovalEntry, ApprovalService, PERMIT2, rememberSpender } from '../../services/blockchain/approvalService';
import { PasscodeSheet } from '../common/PasscodeSheet';
import { ScreenShell } from '../common/ScreenShell';

export const ApprovalsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { activeAddress, activeChainId, activeNetwork, showToast } = useWallet();
  const [entries, setEntries] = useState<ApprovalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState<number | null>(null);
  const [revoking, setRevoking] = useState<ApprovalEntry | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [manualSpender, setManualSpender] = useState('');

  const load = useCallback(async () => {
    if (!activeAddress) return;
    setLoading(true);
    try {
      const known = [
        ...(DEFAULT_TOKENS[activeChainId] || []),
        ...secureStorage.getCustomTokens().filter((t) => t.chainId === activeChainId),
      ].map((t) => ({ address: t.address, symbol: t.symbol, decimals: t.decimals }));
      const res = await ApprovalService.scan(activeChainId, activeAddress, known);
      setEntries(res.entries);
      setScanned(res.scannedBlocks);
    } catch {
      showToast('Could not scan approvals. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeAddress, activeChainId, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const checkManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ethers.isAddress(manualToken) || !ethers.isAddress(manualSpender)) {
      showToast('Enter a valid token and spender address', 'error');
      return;
    }
    rememberSpender(activeAddress, activeChainId, manualToken, manualSpender);
    setManualToken('');
    setManualSpender('');
    await load();
  };

  const short = (a: string) => `${a.slice(0, 8)}…${a.slice(-6)}`;

  return (
    <ScreenShell
      title="Token Approvals"
      onBack={onBack}
      right={
        <button onClick={load} aria-label="Rescan" disabled={loading} className="p-2 text-ink/70 hover:text-ink disabled:opacity-50">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      }
    >
      <p className="text-xs text-muted mb-4">
        Apps you've approved can move these tokens without asking again. Revoke any you no longer use. Network: {activeNetwork.name}.
      </p>

      {scanned === 0 && (
        <div className="mb-3 px-4 py-2.5 rounded-2xl bg-amber-50 text-amber-800 text-xs">
          This network's public RPC doesn't allow history scans, so only common spenders and approvals made here are listed. Use the checker below for a specific spender.
        </div>
      )}
      {scanned !== null && scanned > 0 && (
        <p className="text-[11px] text-muted mb-3">Scanned roughly the last {scanned.toLocaleString()} blocks. Older approvals can be checked manually below.</p>
      )}

      {loading && entries.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted">Scanning…</div>
      ) : entries.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted">No active approvals found.</div>
      ) : (
        <ul className="space-y-2.5">
          {entries.map((a) => (
            <li key={`${a.token}:${a.spender}`} className="px-4 py-3 rounded-3xl bg-card">
              <div className="flex items-center gap-3">
                {a.unlimited && <ShieldAlert size={18} className="text-amber-600 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] text-ink">{a.symbol} · {a.unlimited ? 'Unlimited' : Number(a.formatted).toLocaleString('en-US', { maximumFractionDigits: 4 })}</div>
                  <div className="text-xs text-muted font-mono truncate">
                    Spender {short(a.spender)}{a.spender.toLowerCase() === PERMIT2.toLowerCase() ? ' (Permit2)' : ''}
                  </div>
                </div>
                <a
                  href={`${activeNetwork.blockExplorerUrl}/address/${a.spender}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View spender on explorer"
                  className="p-2 text-muted hover:text-ink"
                >
                  <ExternalLink size={14} />
                </a>
                <button onClick={() => setRevoking(a)} className="px-3 py-1.5 rounded-full bg-peach text-ink text-xs font-semibold">Revoke</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={checkManual} className="mt-6 p-4 rounded-3xl bg-card space-y-2">
        <h3 className="text-sm text-ink">Check a specific spender</h3>
        <input value={manualToken} onChange={(e) => setManualToken(e.target.value.trim())} placeholder="Token contract 0x…" spellCheck={false} className="w-full px-3 py-2.5 rounded-xl bg-white text-xs font-mono text-ink focus:outline-none" />
        <input value={manualSpender} onChange={(e) => setManualSpender(e.target.value.trim())} placeholder="Spender address 0x…" spellCheck={false} className="w-full px-3 py-2.5 rounded-xl bg-white text-xs font-mono text-ink focus:outline-none" />
        <button type="submit" className="btn-secondary !bg-white !h-10 !rounded-xl w-full text-xs">Check allowance</button>
      </form>

      <PasscodeSheet
        open={!!revoking}
        title="Revoke approval"
        description={revoking ? `Sets ${revoking.symbol} allowance for ${short(revoking.spender)} to zero. This costs a small network fee.` : undefined}
        confirmLabel="Revoke"
        onClose={() => setRevoking(null)}
        onUnlocked={async (key) => {
          if (!revoking) return;
          try {
            await ApprovalService.revoke(revoking.chainId, key, revoking.token, revoking.spender);
          } catch (err) {
            const msg = (err as { shortMessage?: string; message?: string })?.shortMessage || (err as Error)?.message || 'Revoke failed';
            throw new Error(msg.split('\n')[0].slice(0, 160));
          }
          showToast('Revoke sent. It will disappear once confirmed.', 'success');
          const done = revoking;
          setRevoking(null);
          setEntries((prev) => prev.filter((e) => !(e.token === done.token && e.spender === done.spender)));
        }}
      />
    </ScreenShell>
  );
};
