import React, { useRef, useState } from 'react';
import { useWallet } from '../../store/WalletContext';
import { PhoneIllustration, CardsIllustration, GlobalIllustration, ShieldIllustration, ChartIllustration } from '../common/Illustrations';
import { APP_NAME } from '../../config/brand';

const slides = [
  {
    title: `${APP_NAME}: Elevate Your Wallet Game!`,
    description: `${APP_NAME}: Take your wallet experience to the next level with confidence and security.`,
    art: <PhoneIllustration />,
  },
  {
    title: 'Get A Crypto Wallet In A Few Clicks!',
    description: 'Get a crypto wallet in a few clicks: Simplify your digital asset management.',
    art: <CardsIllustration />,
  },
  {
    title: 'Go Global With Your Crypto Wallet!',
    description: 'Explore global transactions with your crypto wallet: Seamless transfers anytime.',
    art: <GlobalIllustration />,
  },
  {
    title: 'Your Keys, Your Crypto!',
    description: 'Your keys are encrypted and stay on your device. Only you can approve a transaction.',
    art: <ShieldIllustration />,
  },
  {
    title: 'Swap, Send & Track In One Place!',
    description: 'Swap tokens, send to anyone and watch your portfolio, across all your wallets.',
    art: <ChartIllustration />,
  },
];

export const OnboardingScreen: React.FC = () => {
  const [step, setStep] = useState(0);
  const { updateSettings, setCurrentScreen } = useWallet();
  const touchX = useRef<number | null>(null);

  const finish = () => {
    updateSettings({ hasCompletedOnboarding: true });
    setCurrentScreen('welcome');
  };

  const go = (dir: 1 | -1) => setStep((s) => Math.min(slides.length - 1, Math.max(0, s + dir)));

  const slide = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <div
      className="min-h-[100dvh] w-full page-wash flex flex-col md:flex-row md:items-center md:gap-16 px-5 pt-14 pb-8 md:px-10 lg:px-[10%] select-none"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="flex-1 flex items-center justify-center md:justify-end">
        <div key={step} className="w-full max-w-xs md:max-w-md aspect-[320/300] animate-in fade-in">{slide.art}</div>
      </div>

      <div className="mt-6 md:mt-0 md:flex-1 md:max-w-lg">
        <h2 className="text-[28px] leading-[1.45] font-semibold text-ink tracking-tight">{slide.title}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted max-w-[19rem]">{slide.description}</p>

        <div className="flex items-center gap-2 mt-8 mb-8" role="tablist" aria-label="Onboarding progress">
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === step}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setStep(i)}
              className="py-2"
            >
              <span className={`block h-[3px] w-5 rounded-full transition-colors ${i === step ? 'bg-ink' : 'bg-slate-200'}`} />
            </button>
          ))}
        </div>

        <button onClick={() => (isLast ? finish() : go(1))} className="btn-primary w-full">
          {isLast ? 'Get started' : 'Next'}
        </button>
        <button
          onClick={finish}
          className={`mt-3 w-full py-2 text-sm text-muted hover:text-ink transition ${isLast ? 'invisible' : ''}`}
          aria-hidden={isLast}
          tabIndex={isLast ? -1 : 0}
        >
          Skip
        </button>
      </div>
    </div>
  );
};
