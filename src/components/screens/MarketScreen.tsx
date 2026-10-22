import React, { useState } from 'react';
import { useWallet } from '../../store/WalletContext';
import { Sparkline } from '../common/Sparkline';
import { PullToRefresh } from '../common/PullToRefresh';
import { RowSkeleton } from '../common/Skeleton';
import { StatusBanner } from '../common/StatusBanner';

const CoinImage: React.FC<{ src?: string; symbol: string }> = ({ src, symbol }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="w-10 h-10 rounded-full bg-white text-navy text-xs font-semibold flex items-center justify-center shrink-0 uppercase">
        {symbol.slice(0, 3)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={symbol}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-10 h-10 rounded-full object-contain bg-white shrink-0"
    />
  );
};

export const MarketScreen: React.FC = () => {
  const { marketTokens, isLoadingMarket, refreshMarket, fiat } = useWallet();

  const sorted = [...marketTokens].sort((a, b) => (a.market_cap_rank || 999) - (b.market_cap_rank || 999));

  const fmtPrice = (v: number) => fiat(v ?? 0);

  return (
    <PullToRefresh onRefresh={refreshMarket}>
    <div className="pb-28 px-4 pt-2 md:px-10 lg:px-[10%] animate-in fade-in">
      <StatusBanner />
      {isLoadingMarket && sorted.length === 0 ? (
        <RowSkeleton rows={8} />
      ) : (
        <ul className="space-y-2.5">
          {sorted.map((c) => {
            const change = c.price_change_percentage_24h || 0;
            const up = change >= 0;
            const tone = up ? 'text-emerald-600' : 'text-rose-500';
            return (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3.5 rounded-3xl bg-card">
                <CoinImage src={c.image} symbol={c.symbol} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] text-ink uppercase truncate">{c.symbol}</div>
                  <div className={`text-sm tabular-nums ${tone}`}>{fmtPrice(c.current_price)}</div>
                </div>
                <div className="hidden min-[400px]:block shrink-0">
                  <Sparkline data={c.sparkline_in_7d?.price} up={up} />
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] text-ink/80 tabular-nums">
                    MCap: {c.market_cap ? fiat(c.market_cap, { compact: true }) : 'N/A'}
                  </div>
                  <div className={`text-sm tabular-nums ${tone}`}>
                    24h: {change.toFixed(2)}%
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-6 text-center">
        <button
          onClick={() => refreshMarket()}
          disabled={isLoadingMarket}
          className="text-xs text-muted hover:text-ink disabled:opacity-50"
        >
          {isLoadingMarket ? 'refreshing…' : 'refresh'}
        </button>
      </div>
    </div>
    </PullToRefresh>
  );
};
