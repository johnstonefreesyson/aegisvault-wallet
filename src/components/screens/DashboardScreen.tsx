import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Image as ImageIcon,
  Search,
  Eye,
  EyeOff,
  Copy,
  Plus,
  TrendingUp,
  TrendingDown,
  CreditCard,
  QrCode,
  Coins,
  ShieldCheck,
  Zap,
  Layers,
} from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { TokenIcon } from '../common/TokenIcon';
import { PullToRefresh } from '../common/PullToRefresh';
import { RowSkeleton } from '../common/Skeleton';
import { StatusBanner } from '../common/StatusBanner';
import { TokenBalance } from '../../types';
import { haptic } from '../../utils/notify';

interface DashboardScreenProps {
  onOpenSend: () => void;
  onOpenReceive: () => void;
  onOpenAddToken: () => void;
  onOpenNetworkModal: () => void;
  onOpenBuySell: () => void;
}

const shortAddr = (a: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onOpenSend,
  onOpenReceive,
  onOpenNetworkModal,
  onOpenBuySell,
}) => {
  const {
    visibleTokens,
    tokens,
    settings,
    activeNetwork,
    activeAddress,
    isLoadingBalances,
    refreshBalances,
    balancesUpdatedAt,
    setSelectedToken,
    setCurrentScreen,
    toggleBalanceHidden,
    totalPortfolioUSD,
    portfolioChange24h,
    showToast,
    fiat,
  } = useWallet();

  const [query, setQuery] = useState('');
  const hidden = settings.balanceHidden;
  const hiddenCount = tokens.length - visibleTokens.length;

  // Biggest holdings first, then alphabetical.
  const sorted = useMemo(
    () => [...visibleTokens].sort((a, b) => b.fiatValueUSD - a.fiatValueUSD || a.name.localeCompare(b.name)),
    [visibleTokens]
  );
  const list = sorted.filter(
    (t) => t.name.toLowerCase().includes(query.toLowerCase()) || t.symbol.toLowerCase().includes(query.toLowerCase())
  );

  const ago = (t: number | null) => {
    if (!t) return '';
    const m = Math.round((Date.now() - t) / 60000);
    return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
  };

  const money = (v: number) => (hidden ? '••••' : fiat(v));
  const amount = (t: TokenBalance) =>
    hidden
      ? '••••'
      : `${parseFloat(t.balance).toLocaleString('en-US', { maximumFractionDigits: 4, minimumFractionDigits: 2 })} ${t.symbol}`;

  const open = (t: TokenBalance) => {
    haptic(8);
    setSelectedToken(t);
    setCurrentScreen('token_details');
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(activeAddress);
      showToast('Address copied to clipboard!', 'success');
    } catch {
      showToast('Could not copy address', 'error');
    }
  };

  const change = totalPortfolioUSD > 0 ? portfolioChange24h : 0;
  const up = change >= 0;
  const holdingsCount = tokens.filter((t) => t.fiatValueUSD > 0 || parseFloat(t.balance) > 0).length;

  const actions = [
    { label: 'Send', icon: ArrowUpRight, onClick: onOpenSend, primary: true },
    { label: 'Receive', icon: ArrowDownLeft, onClick: onOpenReceive },
    { label: 'Buy / Sell', icon: CreditCard, onClick: onOpenBuySell },
    { label: 'Swap', icon: ArrowLeftRight, onClick: () => setCurrentScreen('swap') },
  ];

  return (
    <PullToRefresh onRefresh={refreshBalances}>
      <div className="pb-28 px-4 md:px-10 lg:px-[6%] pt-1 w-full animate-in fade-in">
        <StatusBanner />

        {activeNetwork.isTestnet && (
          <div className="mb-3 px-4 py-2.5 rounded-2xl bg-sky/10 text-navy text-xs flex items-center justify-between">
            <span>Connected to a testnet. Tokens here have no real value.</span>
            <button onClick={onOpenNetworkModal} className="underline font-semibold">Switch</button>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          {/* ───────── Balance hero + quick actions ───────── */}
          <section className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-16 mb-6 lg:mb-0">
            <div className="rounded-[28px] bg-gradient-to-br from-[#26407a] via-[#1a2a52] to-[#0f1a38] text-[#ffffff] p-5 sm:p-6 shadow-xl shadow-[#1a2a52]/30 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-[#f4693f]/20 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-[#5aaef0]/20 blur-2xl pointer-events-none" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#ffffff]/70">Total balance</span>
                  <button
                    onClick={toggleBalanceHidden}
                    aria-label={hidden ? 'Show balance' : 'Hide balance'}
                    className="p-1.5 -mr-1.5 text-[#ffffff]/70 hover:text-[#ffffff]"
                  >
                    {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="mt-1 text-[38px] sm:text-[44px] leading-tight font-semibold tracking-tight tabular-nums break-all">
                  {money(totalPortfolioUSD)}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {!hidden && totalPortfolioUSD > 0 && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        up ? 'bg-[#34d399]/20 text-[#6ee7b7]' : 'bg-[#fb7185]/20 text-[#fda4af]'
                      }`}
                    >
                      {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {up ? '+' : ''}
                      {change.toFixed(2)}% · 24h
                    </span>
                  )}
                  <button
                    onClick={onOpenNetworkModal}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[#ffffff]/10 hover:bg-[#ffffff]/15 text-[#ffffff]/90"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeNetwork.color }} />
                    {activeNetwork.name}
                  </button>
                </div>

                <button
                  onClick={copyAddress}
                  className="mt-4 inline-flex items-center gap-2 text-xs text-[#ffffff]/70 hover:text-[#ffffff] font-mono"
                  title="Copy address"
                >
                  {shortAddr(activeAddress)}
                  <Copy size={12} />
                </button>

                <div className="mt-5 grid grid-cols-4 gap-2.5">
                  {actions.map(({ label, icon: Icon, onClick, primary }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <span
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition active:scale-95 ${
                          primary
                            ? 'bg-[#ffdac4] text-[#121a2b] group-hover:bg-[#ffcdb1]'
                            : 'bg-[#ffffff]/10 text-[#ffffff] group-hover:bg-[#ffffff]/20'
                        }`}
                      >
                        <Icon size={20} />
                      </span>
                      <span className="text-[11px] sm:text-xs text-[#ffffff]/85">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Web3 Power Hub */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setCurrentScreen('walletconnect')}
                className="p-3.5 rounded-2xl bg-card border border-slate-200/80 hover:border-coral/60 transition-all text-left group shadow-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-sky/15 text-navy flex items-center justify-center">
                    <QrCode size={16} />
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded-md">
                    dApps
                  </span>
                </div>
                <span className="text-xs font-bold text-ink group-hover:text-coral transition-colors block">
                  WalletConnect
                </span>
                <span className="text-[10px] text-muted block truncate">
                  Connect Uniswap & dApps
                </span>
              </button>

              <button
                onClick={() => setCurrentScreen('staking')}
                className="p-3.5 rounded-2xl bg-card border border-slate-200/80 hover:border-coral/60 transition-all text-left group shadow-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Coins size={16} />
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
                    14.8% APY
                  </span>
                </div>
                <span className="text-xs font-bold text-ink group-hover:text-coral transition-colors block">
                  Earn & Stake
                </span>
                <span className="text-[10px] text-muted block truncate">
                  ETH, SOL, ATOM, BNB
                </span>
              </button>

              <button
                onClick={() => setCurrentScreen('bridge')}
                className="p-3.5 rounded-2xl bg-card border border-slate-200/80 hover:border-coral/60 transition-all text-left group shadow-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-peach/40 text-ink flex items-center justify-center">
                    <Layers size={16} />
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded-md">
                    LI.FI
                  </span>
                </div>
                <span className="text-xs font-bold text-ink group-hover:text-coral transition-colors block">
                  Bridge
                </span>
                <span className="text-[10px] text-muted block truncate">
                  Cross-chain transfer
                </span>
              </button>

              <button
                onClick={() => setCurrentScreen('multichain')}
                className="p-3.5 rounded-2xl bg-card border border-slate-200/80 hover:border-coral/60 transition-all text-left group shadow-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <TrendingUp size={16} />
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded-md">
                    Multi-Chain
                  </span>
                </div>
                <span className="text-xs font-bold text-ink group-hover:text-coral transition-colors block">
                  Non-EVM Hub
                </span>
                <span className="text-[10px] text-muted block truncate">
                  BTC, SOL, TRX, ATOM
                </span>
              </button>

              <button
                onClick={() => setCurrentScreen('security_scanner')}
                className="col-span-2 p-3 rounded-2xl bg-card border border-slate-200/80 hover:border-coral/60 transition-all flex items-center justify-between group shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-ink group-hover:text-coral transition-colors block leading-tight">
                      Security Shield & Risk Scanner
                    </span>
                    <span className="text-[10px] text-muted leading-tight">
                      Honeypots, poisoning & pre-signing simulation
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </button>
            </div>
          </section>

          {/* ───────── Assets ───────── */}
          <section className="lg:col-span-7 xl:col-span-8">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base font-semibold text-ink">
                Assets <span className="text-muted font-normal text-sm">· {holdingsCount} held</span>
              </h2>
              <button
                onClick={() => setCurrentScreen('token_list')}
                className="inline-flex items-center gap-1 text-sm text-coral hover:opacity-80"
              >
                <Plus size={15} /> Manage{hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ''}
              </button>
            </div>

            {visibleTokens.length > 6 && (
              <div className="relative mb-3">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search assets"
                  aria-label="Search assets"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-coral/40"
                />
              </div>
            )}

            {isLoadingBalances && tokens.length === 0 ? (
              <RowSkeleton rows={6} />
            ) : (
              <ul className="space-y-2.5">
                {list.map((t) => {
                  const ch = t.priceChange24h || 0;
                  return (
                    <li key={`${t.chainId}-${t.address}`}>
                      <button
                        onClick={() => open(t)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-3xl bg-card hover:brightness-[0.97] transition text-left"
                      >
                        <TokenIcon symbol={t.symbol} address={t.address} chainId={t.chainId} size={40} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] text-ink truncate">{t.name}</div>
                          <div className="text-sm text-muted tabular-nums flex items-center gap-2">
                            {fiat(t.priceUSD)}
                            {t.priceUSD > 0 && (
                              <span className={ch >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                {ch >= 0 ? '+' : ''}
                                {ch.toFixed(2)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[15px] text-ink tabular-nums">{money(t.fiatValueUSD)}</div>
                          <div className="text-sm text-muted tabular-nums">
                            {amount(t)}
                            {t.stale ? ' ·' : ''}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
                {list.length === 0 && (
                  <li className="py-10 text-center text-sm text-muted">
                    {query ? `No assets matching "${query}"` : 'No assets to show.'}
                  </li>
                )}
              </ul>
            )}

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => refreshBalances()}
                disabled={isLoadingBalances}
                className="text-xs text-muted hover:text-ink transition-colors disabled:opacity-50"
              >
                {isLoadingBalances ? 'refreshing…' : balancesUpdatedAt ? `refresh · updated ${ago(balancesUpdatedAt)}` : 'refresh'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </PullToRefresh>
  );
};
