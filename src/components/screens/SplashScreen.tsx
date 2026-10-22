import React, { useEffect } from 'react';
import { useWallet } from '../../store/WalletContext';
import { WalletLogo } from '../common/WalletLogo';
import { APP_NAME } from '../../config/brand';

export const SplashScreen: React.FC = () => {
  const { vault, settings, setCurrentScreen } = useWallet();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!settings.hasCompletedOnboarding) setCurrentScreen('onboarding');
      else if (!vault) setCurrentScreen('welcome');
      else setCurrentScreen('dashboard');
    }, 1800);
    return () => clearTimeout(timer);
  }, [vault, settings.hasCompletedOnboarding, setCurrentScreen]);

  return (
    <div className="min-h-[100dvh] page-wash flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="animate-pulse mb-6 rounded-[28px] shadow-xl shadow-navy/20">
        <WalletLogo size={96} />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink mb-1">{APP_NAME}</h1>
      <p className="text-sm text-muted max-w-xs mb-8">Secure multi-chain crypto wallet</p>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-coral animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 rounded-full bg-peach animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 rounded-full bg-navy animate-bounce" />
      </div>
    </div>
  );
};
