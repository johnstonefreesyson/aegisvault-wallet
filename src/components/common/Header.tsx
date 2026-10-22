import React from 'react';
import { Wallet } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';

interface HeaderProps {
  onOpenNetworkModal: () => void;
  onOpenAddressModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNetworkModal, onOpenAddressModal }) => {
  const { activeNetwork, currentScreen, totalPortfolioUSD, settings, toggleBalanceHidden, fiat, activeAccount, walletName } = useWallet();

  const titles: Record<string, string> = {
    portfolio: 'Statistics',
    market: 'Market Data (24h)',
    settings: 'Profile',
    transactions: 'Activity',
  };
  const title = titles[currentScreen];

  const balance = settings.balanceHidden ? '••••' : fiat(totalPortfolioUSD);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md px-5 md:px-10 lg:px-[10%] h-14 grid grid-cols-[1fr_auto_1fr] items-center">
      {currentScreen === 'dashboard' ? (
        <button
          onClick={onOpenAddressModal}
          className="justify-self-start flex items-center gap-2 text-sm text-ink hover:opacity-80 min-w-0"
          title="Accounts"
        >
          <span className="w-7 h-7 rounded-full bg-peach text-ink flex items-center justify-center text-xs font-semibold shrink-0">
            {(walletName || 'A').trim().charAt(0).toUpperCase()}
          </span>
          <span className="truncate max-w-[7.5rem] sm:max-w-[12rem]">{walletName}</span>
        </button>
      ) : (
        <button
          onClick={toggleBalanceHidden}
          className="justify-self-start text-sm text-ink/80 hover:text-ink tabular-nums"
          title="Tap to show/hide balance"
        >
          {balance}
        </button>
      )}

      {title ? (
        <span className="text-sm text-ink/80">{title}</span>
      ) : (
        <button
          onClick={onOpenNetworkModal}
          className="text-sm text-ink/80 hover:text-ink flex items-center gap-1.5"
          title="Switch network"
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeNetwork.color }} />
          {activeNetwork.name}
        </button>
      )}

      <button
        onClick={onOpenAddressModal}
        className="justify-self-end p-1.5 -mr-1.5 text-ink/70 hover:text-ink"
        aria-label="Accounts and address"
        title={activeAccount ? `${activeAccount.name} · accounts` : 'Accounts'}
      >
        <Wallet size={18} />
      </button>
    </header>
  );
};
