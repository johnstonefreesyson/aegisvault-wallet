import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Check,
} from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { TokenIcon } from '../common/TokenIcon';
import { TokenBalance } from '../../types';

interface TokenDetailsScreenProps {
  onOpenSendWithToken: (token: TokenBalance) => void;
  onOpenReceiveWithToken: (token: TokenBalance) => void;
  onBack: () => void;
}

export const TokenDetailsScreen: React.FC<TokenDetailsScreenProps> = ({
  onOpenSendWithToken,
  onOpenReceiveWithToken,
  onBack,
}) => {
  const { selectedToken, activeNetwork, transactions, showToast } = useWallet();
  const [copied, setCopied] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState<'24H' | '7D' | '1M'>('7D');

  if (!selectedToken) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>No token selected.</p>
        <button onClick={onBack} className="text-cyan-600 text-xs mt-2 underline">
          Go back
        </button>
      </div>
    );
  }

  const isNative = selectedToken.address === 'native';

  const handleCopyContract = () => {
    if (isNative) return;
    navigator.clipboard.writeText(selectedToken.address);
    setCopied(true);
    showToast('Contract address copied', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const tokenTxs = transactions.filter(
    (t) => t.symbol.toUpperCase() === selectedToken.symbol.toUpperCase()
  );

  const isPositive = selectedToken.priceChange24h >= 0;
  const strokeColor = isPositive ? '#059669' : '#E11D48';

  const points = [
    { x: 0, y: isPositive ? 65 : 35 },
    { x: 50, y: isPositive ? 60 : 40 },
    { x: 100, y: isPositive ? 52 : 48 },
    { x: 150, y: isPositive ? 45 : 55 },
    { x: 200, y: isPositive ? 38 : 62 },
    { x: 250, y: isPositive ? 28 : 70 },
    { x: 300, y: isPositive ? 20 : 80 },
  ];

  const pathData = `M 0 100 L ${points.map((p) => `${p.x} ${p.y}`).join(' L ')} L 300 100 Z`;
  const lineData = `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`;

  return (
    <div className="pb-24 px-4 pt-3 md:px-10 lg:px-[10%] space-y-5 animate-in fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <TokenIcon
            symbol={selectedToken.symbol}
            address={selectedToken.address}
            chainId={selectedToken.chainId}
            size={24}
          />
          <span className="text-xs font-bold text-slate-900">
            {selectedToken.name} ({selectedToken.symbol})
          </span>
        </div>
        <div className="w-8" />
      </div>

      {/* Main Balance & Price Card */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block mb-0.5 font-medium">Your Holding</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {parseFloat(selectedToken.balance).toFixed(4)} {selectedToken.symbol}
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              ≈ ${selectedToken.fiatValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 block mb-0.5 font-medium">Market Price</span>
            <span className="text-base font-extrabold text-slate-900 font-mono block">
              ${selectedToken.priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
            <span
              className={`text-xs font-mono font-bold flex items-center justify-end gap-0.5 ${
                isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{isPositive ? '+' : ''}{selectedToken.priceChange24h.toFixed(2)}%</span>
            </span>
          </div>
        </div>

        {/* Interactive Chart Visual */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-400 font-mono">Price Movement</span>
            <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px]">
              {(['24H', '7D', '1M'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setActiveTimeframe(tf)}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    activeTimeframe === tf ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-28 w-full relative bg-slate-50 rounded-2xl p-2 border border-slate-100">
            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradientLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={pathData} fill="url(#chartGradientLight)" />
              <path d={lineData} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Send / Receive Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => onOpenSendWithToken(selectedToken)}
            className="py-3 px-4 rounded-2xl bg-peach hover:bg-peach-hover text-ink font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <ArrowUpRight size={16} />
            <span>Send {selectedToken.symbol}</span>
          </button>
          <button
            onClick={() => onOpenReceiveWithToken(selectedToken)}
            className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-200"
          >
            <ArrowDownLeft size={16} />
            <span>Receive</span>
          </button>
        </div>
      </div>

      {/* Contract & Network Metadata */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5 text-xs">
        <h4 className="font-bold text-slate-900 text-xs mb-1">Contract & Specifications</h4>
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">Blockchain</span>
          <span className="text-slate-800 font-medium">{activeNetwork.name}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">Token Standard</span>
          <span className="text-slate-800 font-medium">{isNative ? 'Native Coin' : 'ERC-20'}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">Decimals</span>
          <span className="text-slate-800 font-mono font-medium">{selectedToken.decimals}</span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-slate-500">Contract Address</span>
          {isNative ? (
            <span className="text-slate-500">Native Asset</span>
          ) : (
            <button
              onClick={handleCopyContract}
              className="flex items-center gap-1 font-mono text-cyan-600 hover:text-cyan-700 font-semibold"
            >
              <span>{selectedToken.address.slice(0, 8)}...{selectedToken.address.slice(-6)}</span>
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* Explorer Link */}
      <div>
        <a
          href={
            isNative
              ? `${activeNetwork.blockExplorerUrl}`
              : `${activeNetwork.blockExplorerUrl}/token/${selectedToken.address}`
          }
          target="_blank"
          rel="noreferrer"
          className="w-full py-3 px-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          <span>View on Block Explorer</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* History for this token */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-900">Token History</h4>
        {tokenTxs.length === 0 ? (
          <div className="p-4 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500 shadow-xs">
            No past transactions for {selectedToken.symbol} on this device.
          </div>
        ) : (
          tokenTxs.map((tx) => (
            <div
              key={tx.hash}
              className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-xs"
            >
              <div>
                <span className="text-slate-900 font-bold capitalize block">{tx.type}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(tx.timestamp).toLocaleDateString()}
                </span>
              </div>
              <span className="font-mono text-slate-800 font-semibold">
                {tx.amount} {tx.symbol}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
