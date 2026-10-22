import React, { useState } from 'react';
import { ArrowLeft, ShieldAlert, ChevronDown, Check, Copy, Share2 } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { QRDisplay } from '../common/QRDisplay';
import { TokenIcon } from '../common/TokenIcon';
import { TokenBalance } from '../../types';

interface ReceiveScreenProps {
  initialToken?: TokenBalance | null;
  onClose: () => void;
}

export const ReceiveScreen: React.FC<ReceiveScreenProps> = ({ initialToken, onClose }) => {
  const { activeAddress, activeNetwork, tokens, showToast } = useWallet();

  const [selectedToken, setSelectedToken] = useState<TokenBalance>(() => {
    return initialToken || tokens[0] || {
      address: 'native',
      chainId: activeNetwork.chainId,
      symbol: activeNetwork.nativeCurrency.symbol,
      name: activeNetwork.nativeCurrency.name,
      decimals: 18,
      balance: '0.0',
      balanceRaw: '0',
      fiatValueUSD: 0,
      priceUSD: 0,
      priceChange24h: 0,
    };
  });

  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-50 page-wash flex flex-col justify-between p-4 md:px-10 lg:px-[10%] overflow-y-auto">
      <div>
        {/* Top bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Receive Assets
          </span>
          <div className="w-8" />
        </div>

        {/* Selected Asset Selector */}
        <div className="relative mb-5">
          <button
            type="button"
            onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
            className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between transition-colors shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <TokenIcon
                symbol={selectedToken.symbol}
                address={selectedToken.address}
                chainId={selectedToken.chainId}
                size={30}
              />
              <div className="text-left">
                <span className="text-xs font-bold text-slate-900 block">
                  {selectedToken.name} ({selectedToken.symbol})
                </span>
                <span className="text-[11px] text-slate-500">
                  Network: {activeNetwork.name}
                </span>
              </div>
            </div>
            <ChevronDown size={16} className="text-slate-500" />
          </button>

          {isTokenDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-white border border-slate-200 rounded-2xl shadow-md z-20 max-h-52 overflow-y-auto space-y-1">
              {tokens.map((t) => (
                <button
                  key={`${t.chainId}-${t.address}`}
                  type="button"
                  onClick={() => {
                    setSelectedToken(t);
                    setIsTokenDropdownOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol={t.symbol} address={t.address} chainId={t.chainId} size={24} />
                    <span className="text-xs font-bold text-slate-900">{t.name}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{t.symbol}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Real QR Code Display */}
        <div className="py-2">
          <QRDisplay
            value={activeAddress}
            size={210}
            label={`Scan to send ${selectedToken.symbol} on ${activeNetwork.name}`}
          />
        </div>

        {/* Warning Callout */}
        <div className="mt-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-start gap-2.5">
          <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Send only <strong className="text-amber-700">{selectedToken.symbol}</strong> or EVM-compatible tokens on <strong className="text-amber-700">{activeNetwork.name}</strong> to this address. Sending assets via another blockchain (e.g. Bitcoin, Solana) may result in permanent loss.
          </p>
        </div>
      </div>

      <div className="pt-4 pb-2">
        <button
          onClick={onClose}
          className="w-full h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
        >
          Back to Wallet
        </button>
      </div>
    </div>
  );
};
