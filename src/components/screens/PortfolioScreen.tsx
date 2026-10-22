import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { secureStorage } from '../../services/storage/secureStorage';
import { LineChart } from '../common/LineChart';
import { downloadText, toCsv } from '../../utils/csv';

const DOTS = ['#2dd4bf', '#facc15', '#a855f7', '#10b981', '#84cc16', '#f59e0b', '#22c55e', '#34d399', '#5aaef0', '#f4693f'];
const RANGES = [
  { key: '24h', ms: 24 * 3600e3 },
  { key: '7d', ms: 7 * 24 * 3600e3 },
  { key: '30d', ms: 30 * 24 * 3600e3 },
  { key: 'All', ms: Infinity },
] as const;

export const PortfolioScreen: React.FC = () => {
  const { totalPortfolioUSD, tokens, activeNetwork, activeAddress, activeChainId, transactions, settings, fiat, showToast } = useWallet();
  const hide = settings.balanceHidden;
  const usd = (v: number) => (hide ? '••••' : fiat(v));
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('7d');

  const history = useMemo(
    () => secureStorage.getPortfolioHistory(`${activeAddress}:${activeChainId}`),
    // totalPortfolioUSD changes whenever a new point may have been recorded
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeAddress, activeChainId, totalPortfolioUSD]
  );
  const points = useMemo(() => {
    const ms = RANGES.find((r) => r.key === range)!.ms;
    const from = Date.now() - ms;
    return history.filter((p) => p.t >= from).map((p) => ({ t: p.t, v: p.usd }));
  }, [history, range]);

  const exportTransactions = () => {
    if (transactions.length === 0) return showToast('No transactions to export yet', 'info');
    const csv = toCsv(
      ['date_utc', 'hash', 'network_chain_id', 'type', 'status', 'from', 'to', 'amount', 'symbol', 'token_contract', 'fee_native', 'fee_usd'],
      transactions.map((t) => [
        new Date(t.timestamp).toISOString(), t.hash, t.chainId, t.type, t.status, t.from, t.to,
        t.amount, t.symbol, t.tokenAddress || '', t.gasFeeEth || '', t.gasFeeUSD ?? '',
      ])
    );
    downloadText(`transactions-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const exportHistory = () => {
    if (history.length === 0) return showToast('No history recorded yet', 'info');
    downloadText(
      `portfolio-history-${activeNetwork.id}.csv`,
      toCsv(['date_utc', 'total_usd'], history.map((p) => [new Date(p.t).toISOString(), p.usd.toFixed(2)]))
    );
  };

  return (
    <div className="pb-28 px-4 pt-2 md:px-10 lg:px-[10%] space-y-3 animate-in fade-in">
      <section className="rounded-3xl bg-card px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[15px] text-ink">Value over time</h2>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-2.5 py-1 rounded-full text-[11px] ${range === r.key ? 'bg-peach text-ink' : 'text-muted'}`}
              >
                {r.key}
              </button>
            ))}
          </div>
        </div>
        <div className="text-2xl text-ink tabular-nums mb-1">{usd(totalPortfolioUSD)}</div>
        <p className="text-[11px] text-muted mb-2">{activeNetwork.name} only. Recorded on this device.</p>
        {hide ? <div className="py-8 text-center text-sm text-muted">Hidden</div> : <LineChart points={points} />}
      </section>

      <section className="rounded-3xl bg-card px-5 py-4">
        <h2 className="text-[15px] text-ink mb-3">Portfolio Statistics</h2>
        <div className="flex items-center justify-between py-2 text-sm">
          <span className="text-ink/80">Total Tokens</span>
          <span className="text-ink/80">{tokens.length}</span>
        </div>
        <div className="h-px bg-slate-200/80" />
        <div className="flex items-center justify-between py-2 text-sm">
          <span className="text-ink/80">Network</span>
          <span className="text-ink/80">{activeNetwork.name}</span>
        </div>
      </section>

      <section className="rounded-3xl bg-card px-5 py-4">
        <h2 className="text-[15px] text-ink mb-3">Portfolio Allocation</h2>
        <ul className="space-y-3">
          {tokens.map((t, i) => {
            const pct = totalPortfolioUSD > 0 ? (t.fiatValueUSD / totalPortfolioUSD) * 100 : 0;
            return (
              <li key={`${t.chainId}-${t.address}`} className="flex items-center gap-3 text-sm text-ink/80">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DOTS[i % DOTS.length] }} />
                <span className="flex-1 truncate">{t.name} - {usd(t.fiatValueUSD)}</span>
                <span className="tabular-nums">{pct.toFixed(1)}%</span>
              </li>
            );
          })}
          {tokens.length === 0 && <li className="text-sm text-muted">No assets yet.</li>}
        </ul>
      </section>

      <section className="rounded-3xl bg-card px-5 py-4">
        <h2 className="text-[15px] text-ink mb-3">Export</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={exportTransactions} className="btn-secondary !h-11 !rounded-2xl text-xs"><Download size={14} /> Transactions CSV</button>
          <button onClick={exportHistory} className="btn-secondary !h-11 !rounded-2xl text-xs"><Download size={14} /> Value history CSV</button>
        </div>
      </section>
    </div>
  );
};
