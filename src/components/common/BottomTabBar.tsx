import React from 'react';
import { House, ChartCandlestick, CircleUser } from 'lucide-react';
import { NavigationScreen } from '../../types';
import { useWallet } from '../../store/WalletContext';
import { haptic } from '../../utils/notify';

const FourCircles: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="7" cy="7" r="3.5" /><circle cx="17" cy="7" r="3.5" />
    <circle cx="7" cy="17" r="3.5" /><circle cx="17" cy="17" r="3.5" />
  </svg>
);

export const BottomTabBar: React.FC = () => {
  const { currentScreen, setCurrentScreen } = useWallet();

  const tabs: { screen: NavigationScreen; label: string; icon: React.ReactNode }[] = [
    { screen: 'dashboard', label: 'Home', icon: <House size={24} strokeWidth={1.6} /> },
    { screen: 'portfolio', label: 'Statistics', icon: <ChartCandlestick size={24} strokeWidth={1.6} /> },
    { screen: 'market', label: 'Market', icon: <FourCircles /> },
    { screen: 'settings', label: 'Profile', icon: <CircleUser size={24} strokeWidth={1.6} /> },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md rounded-t-3xl px-4 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(18,26,43,0.05)]"
    >
      <div className="grid grid-cols-4 items-center h-16">
        {tabs.map((tab) => {
          const active = currentScreen === tab.screen;
          return (
            <button
              key={tab.screen}
              onClick={() => {
                if (!active) haptic(8);
                setCurrentScreen(tab.screen);
              }}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center justify-center h-full transition-colors ${
                active ? 'text-coral' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
