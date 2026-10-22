import React from 'react';
import logo from '../../assets/images/logo.png';
import { APP_NAME } from '../../config/brand';

interface WalletLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  variant?: 'shield' | 'circle';
}

export const WalletLogo: React.FC<WalletLogoProps> = ({ size = 40, showText = false, className = '' }) => (
  <div className={`inline-flex items-center gap-3 select-none ${className}`}>
    <img
      src={logo}
      alt={`${APP_NAME} logo`}
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: size * 0.24 }}
      className="shrink-0 object-cover"
    />
    {showText && (
      <div className="flex flex-col text-left">
        <span className="text-base font-bold tracking-tight text-ink">{APP_NAME}</span>
        <span className="text-[11px] text-muted font-medium">Non-Custodial Multi-Chain Wallet</span>
      </div>
    )}
  </div>
);
