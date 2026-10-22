import React from 'react';
import { useWallet } from '../../store/WalletContext';
import { WalletLogo } from '../common/WalletLogo';
import { APP_NAME } from '../../config/brand';

export const WelcomeScreen: React.FC = () => {
  const { setCurrentScreen } = useWallet();

  return (
    <div className="min-h-[100dvh] w-full page-wash flex flex-col justify-between px-5 py-8 md:px-10 lg:px-[10%]">
      <div />
      <div className="w-full md:max-w-md md:mx-auto">
        <div className="mb-6 shadow-xl shadow-navy/25 rounded-[18px] w-fit">
          <WalletLogo size={64} />
        </div>
        <h1 className="text-[28px] font-semibold text-ink tracking-tight mb-3">Welcome To {APP_NAME}</h1>
        <p className="text-[15px] leading-relaxed text-muted max-w-[19rem] mb-8">
          Create a new crypto wallet in just a few steps or regain access to your crypto wallet.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setCurrentScreen('create_wallet')} className="btn-primary">New wallet</button>
          <button onClick={() => setCurrentScreen('import_wallet')} className="btn-secondary">Restore wallet</button>
        </div>
      </div>
      <div className="pt-10 text-center">
        <button
          onClick={() => setCurrentScreen('legal_privacy')}
          className="text-xs text-muted hover:text-ink underline underline-offset-2 transition-colors"
        >
          Terms of Service & Privacy Policy
        </button>
      </div>
    </div>
  );
};
