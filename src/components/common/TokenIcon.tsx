import React, { useState } from 'react';
import { SupportedChainId } from '../../types';
import { getTrustWalletAssetUrl } from '../../utils/tokenImages';

interface TokenIconProps {
  symbol: string;
  address?: string;
  chainId?: SupportedChainId;
  size?: number;
  className?: string;
}

export const TokenIcon: React.FC<TokenIconProps> = ({ symbol, address, chainId, size = 36, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const sym = symbol.toUpperCase();

  // Prefer the real asset logo; fall back to the built-in vector icons below.
  if (chainId && !failed) {
    return (
      <img
        src={getTrustWalletAssetUrl(chainId, address || 'native', symbol)}
        alt={symbol}
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover shrink-0 bg-white ${className}`}
      />
    );
  }


  // Distinct SVGs for major cryptocurrencies
  switch (sym) {
    case 'ETH':
    case 'WETH':
      return (
        <div
          style={{ width: size, height: size }}
          className={`rounded-full bg-[#627EEA]/20 flex items-center justify-center shrink-0 border border-[#627EEA]/40 ${className}`}
        >
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 784.37 1277.39" fill="none">
            <path d="M392.07 0L383.5 29.11V874.74L392.07 883.29L784.13 651.54L392.07 0Z" fill="#627EEA" />
            <path d="M392.07 0L0 651.54L392.07 883.29V472.33V0Z" fill="#8A92B2" />
            <path d="M392.07 956.17L387.24 962.06V1268.61L392.07 1277.38L784.37 724.89L392.07 956.17Z" fill="#627EEA" />
            <path d="M392.07 1277.38V956.17L0 724.89L392.07 1277.38Z" fill="#8A92B2" />
            <path d="M392.07 883.3L784.13 651.54L392.07 472.34V883.3Z" fill="#454A75" />
            <path d="M0 651.54L392.07 883.3V472.34L0 651.54Z" fill="#627EEA" />
          </svg>
        </div>
      );
    case 'BNB':
      return (
        <div
          style={{ width: size, height: size }}
          className={`rounded-full bg-[#F0B90B]/20 flex items-center justify-center shrink-0 border border-[#F0B90B]/40 ${className}`}
        >
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 32 32" fill="none">
            <path
              d="M16 3.5l4.8 4.8-2.5 2.5L16 8.5l-2.3 2.3-2.5-2.5L16 3.5zm7.7 7.7l2.5 2.5-2.5 2.5-2.5-2.5 2.5-2.5zm-15.4 0l2.5 2.5-2.5 2.5-2.5-2.5 2.5-2.5zm7.7 2.6l4.7 4.7-4.7 4.7-4.7-4.7 4.7-4.7zm0-5.1l-2.3 2.3 2.3 2.3 2.3-2.3-2.3-2.3zm10.1 7.6l2.3 2.3-4.8 4.8-2.3-2.3 2.5-2.5 2.3-2.3zm-20.2 0l2.3 2.3 2.5 2.5-2.3 2.3-4.8-4.8 2.3-2.3zm10.1 10.1l2.3-2.3 2.5 2.5-4.8 4.8-4.8-4.8 2.5-2.5 2.3 2.3z"
              fill="#F0B90B"
            />
          </svg>
        </div>
      );
    case 'POL':
    case 'MATIC':
      return (
        <div
          style={{ width: size, height: size }}
          className={`rounded-full bg-[#8247E5]/20 flex items-center justify-center shrink-0 border border-[#8247E5]/40 ${className}`}
        >
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 32 32" fill="none">
            <path
              d="M21.2 12.6l-4.7-2.7a1 1 0 0 0-1 0l-4.7 2.7a1 1 0 0 0-.5.9v5.4a1 1 0 0 0 .5.9l4.7 2.7c.3.2.7.2 1 0l4.7-2.7a1 1 0 0 0 .5-.9v-5.4a1 1 0 0 0-.5-.9z"
              stroke="#8247E5"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    case 'USDT':
      return (
        <div
          style={{ width: size, height: size }}
          className={`rounded-full bg-[#26A17B]/20 flex items-center justify-center shrink-0 border border-[#26A17B]/40 ${className}`}
        >
          <span className="font-bold text-[#26A17B] text-xs">₮</span>
        </div>
      );
    case 'USDC':
      return (
        <div
          style={{ width: size, height: size }}
          className={`rounded-full bg-[#2775CA]/20 flex items-center justify-center shrink-0 border border-[#2775CA]/40 ${className}`}
        >
          <span className="font-bold text-[#2775CA] text-xs">$</span>
        </div>
      );
    case 'BTC':
    case 'WBTC':
      return (
        <div
          style={{ width: size, height: size }}
          className={`rounded-full bg-[#F7931A]/20 flex items-center justify-center shrink-0 border border-[#F7931A]/40 ${className}`}
        >
          <span className="font-bold text-[#F7931A] text-xs">₿</span>
        </div>
      );
    case 'DAI':
      return (
        <div
          style={{ width: size, height: size }}
          className={`rounded-full bg-[#F5AC37]/20 flex items-center justify-center shrink-0 border border-[#F5AC37]/40 ${className}`}
        >
          <span className="font-bold text-[#F5AC37] text-xs">◈</span>
        </div>
      );
    case 'LINK':
      return (
        <div
          style={{ width: size, height: size }}
          className={`rounded-full bg-[#375BD2]/20 flex items-center justify-center shrink-0 border border-[#375BD2]/40 ${className}`}
        >
          <span className="font-bold text-[#375BD2] text-xs">⬡</span>
        </div>
      );
    default:
      return (
        <div
          style={{ width: size, height: size }}
          className={`rounded-full bg-slate-100 text-slate-600 font-semibold flex items-center justify-center shrink-0 border border-slate-200 text-xs ${className}`}
        >
          {sym.slice(0, 3)}
        </div>
      );
  }
};
