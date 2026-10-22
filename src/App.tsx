/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useState } from 'react';
import { WalletProvider, useWallet } from './store/WalletContext';
import { Header } from './components/common/Header';
import { BottomTabBar } from './components/common/BottomTabBar';
import { Toast } from './components/common/Toast';

// Screens
import { SplashScreen } from './components/screens/SplashScreen';
import { OnboardingScreen } from './components/screens/OnboardingScreen';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { UnlockScreen } from './components/screens/UnlockScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';

// Modals
import { NetworkSelectorModal } from './components/screens/NetworkSelectorModal';
import { TokenBalance } from './types';
import { AddressViewModal } from './components/screens/AddressViewModal';
import { useAutoLock } from './hooks/useAutoLock';
import { useTheme } from './hooks/useTheme';

// Heavier screens are split into their own chunks and loaded on demand.
const CreateWalletScreen = lazy(() => import('./components/screens/CreateWalletScreen').then((m) => ({ default: m.CreateWalletScreen })));
const ImportWalletScreen = lazy(() => import('./components/screens/ImportWalletScreen').then((m) => ({ default: m.ImportWalletScreen })));
const TokenListScreen = lazy(() => import('./components/screens/TokenListScreen').then((m) => ({ default: m.TokenListScreen })));
const TokenDetailsScreen = lazy(() => import('./components/screens/TokenDetailsScreen').then((m) => ({ default: m.TokenDetailsScreen })));
const TransactionsScreen = lazy(() => import('./components/screens/TransactionsScreen').then((m) => ({ default: m.TransactionsScreen })));
const TransactionDetailsScreen = lazy(() => import('./components/screens/TransactionDetailsScreen').then((m) => ({ default: m.TransactionDetailsScreen })));
const PortfolioScreen = lazy(() => import('./components/screens/PortfolioScreen').then((m) => ({ default: m.PortfolioScreen })));
const MarketScreen = lazy(() => import('./components/screens/MarketScreen').then((m) => ({ default: m.MarketScreen })));
const SettingsScreen = lazy(() => import('./components/screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));
const LegalPrivacyScreen = lazy(() => import('./components/screens/LegalPrivacyScreen').then((m) => ({ default: m.LegalPrivacyScreen })));
const SendScreen = lazy(() => import('./components/screens/SendScreen').then((m) => ({ default: m.SendScreen })));
const ReceiveScreen = lazy(() => import('./components/screens/ReceiveScreen').then((m) => ({ default: m.ReceiveScreen })));
const AddCustomTokenScreen = lazy(() => import('./components/screens/AddCustomTokenScreen').then((m) => ({ default: m.AddCustomTokenScreen })));
const BackupSeedModal = lazy(() => import('./components/screens/BackupSeedModal').then((m) => ({ default: m.BackupSeedModal })));
const ContactsScreen = lazy(() => import('./components/screens/ContactsScreen').then((m) => ({ default: m.ContactsScreen })));
const AccountsModal = lazy(() => import('./components/screens/AccountsModal').then((m) => ({ default: m.AccountsModal })));
const ApprovalsScreen = lazy(() => import('./components/screens/ApprovalsScreen').then((m) => ({ default: m.ApprovalsScreen })));
const SwapScreen = lazy(() => import('./components/screens/SwapScreen').then((m) => ({ default: m.SwapScreen })));
const NftScreen = lazy(() => import('./components/screens/NftScreen').then((m) => ({ default: m.NftScreen })));
const PriceAlertsScreen = lazy(() => import('./components/screens/PriceAlertsScreen').then((m) => ({ default: m.PriceAlertsScreen })));

const ScreenFallback: React.FC = () => (
  <div className="flex-1 flex items-center justify-center py-24" role="status" aria-label="Loading">
    <div className="w-6 h-6 border-2 border-coral border-t-transparent rounded-full animate-spin" />
  </div>
);

const MainAppContent: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    vault,
    isUnlocked,
    selectedToken,
    settings,
    lockWallet,
  } = useWallet();

  useTheme(settings.theme);
  useAutoLock(!!vault && isUnlocked, settings.autoLockMinutes, lockWallet);

  // Modals state
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [sendTokenOverride, setSendTokenOverride] = useState<TokenBalance | null>(null);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [receiveTokenOverride, setReceiveTokenOverride] = useState<TokenBalance | null>(null);
  const [isAddTokenOpen, setIsAddTokenOpen] = useState(false);
  const [isBackupSeedOpen, setIsBackupSeedOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);

  // Splash Screen initial display
  if (currentScreen === 'splash') {
    return <SplashScreen />;
  }

  // If no wallet created or imported yet
  if (!vault) {
    const screen = (() => {
    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingScreen />;
      case 'create_wallet':
        return <CreateWalletScreen />;
      case 'import_wallet':
        return <ImportWalletScreen />;
      case 'legal_privacy':
        return <LegalPrivacyScreen onBack={() => setCurrentScreen('welcome')} />;
      case 'welcome':
      default:
        return <WelcomeScreen />;
    }
    })();
    return <Suspense fallback={<ScreenFallback />}>{screen}</Suspense>;
  }

  // If wallet exists but session is locked
  if (!isUnlocked) {
    return <UnlockScreen />;
  }

  // Logged-in screens
  const showBottomBar = [
    'dashboard',
    'market',
    'portfolio',
    'transactions',
    'settings',
  ].includes(currentScreen);

  return (
    <div className="flex-1 flex flex-col w-full min-h-[100dvh] page-wash text-ink relative">
      <Header
        onOpenNetworkModal={() => setIsNetworkModalOpen(true)}
        onOpenAddressModal={() => setIsAccountsOpen(true)}
      />

      <Suspense fallback={<ScreenFallback />}>
      <div className="flex-1 w-full">
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            onOpenSend={() => {
              setSendTokenOverride(null);
              setIsSendOpen(true);
            }}
            onOpenReceive={() => {
              setReceiveTokenOverride(null);
              setIsReceiveOpen(true);
            }}
            onOpenAddToken={() => setIsAddTokenOpen(true)}
            onOpenNetworkModal={() => setIsNetworkModalOpen(true)}
          />
        )}

        {currentScreen === 'token_list' && (
          <TokenListScreen
            onOpenAddCustomToken={() => setIsAddTokenOpen(true)}
            onClose={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'token_details' && (
          <TokenDetailsScreen
            onOpenSendWithToken={(token) => {
              setSendTokenOverride(token);
              setIsSendOpen(true);
            }}
            onOpenReceiveWithToken={(token) => {
              setReceiveTokenOverride(token);
              setIsReceiveOpen(true);
            }}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'transactions' && <TransactionsScreen />}

        {currentScreen === 'transaction_details' && (
          <TransactionDetailsScreen onBack={() => setCurrentScreen('transactions')} />
        )}

        {currentScreen === 'portfolio' && <PortfolioScreen />}

        {currentScreen === 'market' && <MarketScreen />}

        {currentScreen === 'settings' && (
          <SettingsScreen
            onOpenNetworkModal={() => setIsNetworkModalOpen(true)}
            onOpenBackupSeed={() => setIsBackupSeedOpen(true)}
            onOpenAddressView={() => setIsAddressModalOpen(true)}
            onOpenLegal={() => setCurrentScreen('legal_privacy')}
          />
        )}

        {currentScreen === 'legal_privacy' && (
          <LegalPrivacyScreen onBack={() => setCurrentScreen('settings')} />
        )}

        {currentScreen === 'contacts' && <ContactsScreen onBack={() => setCurrentScreen('settings')} />}

        {currentScreen === 'approvals' && <ApprovalsScreen onBack={() => setCurrentScreen('settings')} />}
        {currentScreen === 'price_alerts' && <PriceAlertsScreen onBack={() => setCurrentScreen('settings')} />}
        {currentScreen === 'swap' && <SwapScreen onBack={() => setCurrentScreen('dashboard')} />}
        {currentScreen === 'nfts' && <NftScreen onBack={() => setCurrentScreen('dashboard')} />}
      </div>

      {showBottomBar && <BottomTabBar />}

      {/* Global Modals */}
      <NetworkSelectorModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
      />

      {isSendOpen && (
        <SendScreen
          initialToken={sendTokenOverride || selectedToken}
          onClose={() => {
            setIsSendOpen(false);
            setSendTokenOverride(null);
          }}
        />
      )}

      {isReceiveOpen && (
        <ReceiveScreen
          initialToken={receiveTokenOverride || selectedToken}
          onClose={() => {
            setIsReceiveOpen(false);
            setReceiveTokenOverride(null);
          }}
        />
      )}

      {isAddTokenOpen && (
        <AddCustomTokenScreen onClose={() => setIsAddTokenOpen(false)} />
      )}

      <BackupSeedModal
        isOpen={isBackupSeedOpen}
        onClose={() => setIsBackupSeedOpen(false)}
      />

      <AddressViewModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
      />

      <AccountsModal
        isOpen={isAccountsOpen}
        onClose={() => setIsAccountsOpen(false)}
        onShowAddress={() => setIsAddressModalOpen(true)}
      />
      </Suspense>
    </div>
  );
};

export default function App() {
  return (
    <WalletProvider>
      <div className="min-h-[100dvh] w-full page-wash text-ink flex">
        <div className="w-full min-h-[100dvh] page-wash flex flex-col relative">
          <MainAppContent />
          <Toast />
        </div>
      </div>
    </WalletProvider>
  );
}
