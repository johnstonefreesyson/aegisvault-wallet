import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BlockchainNetwork,
  EncryptedWalletVault,
  NavigationScreen,
  SupportedChainId,
  TokenBalance,
  TokenMetadata,
  WalletSettings,
  WalletTransaction,
  MarketToken,
  WalletAccount,
  Contact,
  PriceAlert,
} from '../types';
import { DEFAULT_CHAIN_ID, DEFAULT_TOKENS, SUPPORTED_NETWORKS } from '../config/networks';
import { secureStorage } from '../services/storage/secureStorage';
import { WalletManager } from '../services/blockchain/walletManager';
import { rpcService } from '../services/blockchain/rpcProvider';
import { TokenService } from '../services/blockchain/tokenService';
import { marketService } from '../services/market/coingecko';
import { FALLBACK_RATES, formatFiat, loadRates } from '../services/market/fx';
import { systemNotify } from '../utils/notify';

interface WalletContextType {
  // Navigation
  currentScreen: NavigationScreen;
  setCurrentScreen: (screen: NavigationScreen) => void;
  selectedToken: TokenBalance | null;
  setSelectedToken: (token: TokenBalance | null) => void;
  selectedTx: WalletTransaction | null;
  setSelectedTx: (tx: WalletTransaction | null) => void;

  // Vault & Identity
  vault: EncryptedWalletVault | null;
  isUnlocked: boolean;
  activeAddress: string;
  walletName: string;
  createWallet: (name: string, phrase: string, pin: string) => Promise<void>;
  importWallet: (name: string, phraseOrKey: string, pin: string) => Promise<void>;
  lockWallet: () => void;
  unlockWallet: (pin: string) => Promise<boolean>;
  removeWallet: () => void;
  updateWalletName: (name: string) => void;

  // Accounts (HD index derivation)
  accounts: WalletAccount[];
  activeAccount: WalletAccount | null;
  canAddAccount: boolean;
  /** The vault (wallet) that owns the active account: its keys / recovery phrase back that account. */
  activeVault: EncryptedWalletVault | null;
  addAccount: (name: string, passcode: string) => Promise<void>;
  /** Adds a brand-new wallet (own recovery phrase) or imports one (phrase or private key) as a new account. */
  addWallet: (opts: { mode: 'create' | 'import'; name: string; secret: string; passcode: string }) => Promise<void>;
  switchAccount: (id: string) => void;
  renameAccount: (id: string, name: string) => void;

  // Address book
  contacts: Contact[];
  saveContact: (c: { id?: string; name: string; address: string }) => void;
  removeContact: (id: string) => void;

  // Network
  activeChainId: SupportedChainId;
  activeNetwork: BlockchainNetwork;
  switchNetwork: (chainId: SupportedChainId) => void;

  // Balances & Tokens
  tokens: TokenBalance[];
  totalPortfolioUSD: number;
  portfolioChange24h: number;
  isLoadingBalances: boolean;
  refreshBalances: () => Promise<void>;
  visibleTokens: TokenBalance[];
  hiddenTokenKeys: string[];
  tokenKey: (t: { chainId: number; address: string }) => string;
  toggleTokenHidden: (t: { chainId: number; address: string }) => void;
  loadError: boolean;
  balancesUpdatedAt: number | null;
  isOnline: boolean;
  addCustomToken: (token: TokenMetadata) => Promise<void>;
  removeCustomToken: (address: string) => void;

  // Price alerts (checked while the app is open)
  priceAlerts: PriceAlert[];
  addPriceAlert: (a: Omit<PriceAlert, 'id' | 'createdAt' | 'triggeredAt'>) => void;
  removePriceAlert: (id: string) => void;

  // Transactions
  transactions: WalletTransaction[];
  addTransaction: (tx: WalletTransaction) => void;

  // Market
  marketTokens: MarketToken[];
  isLoadingMarket: boolean;
  refreshMarket: () => Promise<void>;

  // Settings
  settings: WalletSettings;
  updateSettings: (newSettings: Partial<WalletSettings>) => void;
  toggleBalanceHidden: () => void;

  // Fiat display (converted from USD)
  fiat: (usd: number, opts?: { compact?: boolean }) => string;

  // Notification Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WalletSettings>(() => secureStorage.getSettings());
  const [vault, setVault] = useState<EncryptedWalletVault | null>(() => secureStorage.getEncryptedVault());
  const [extraVaults, setExtraVaults] = useState<EncryptedWalletVault[]>(() => secureStorage.getExtraVaults());
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => secureStorage.isSessionUnlocked());
  const [activeChainId, setActiveChainId] = useState<SupportedChainId>(settings.activeChainId || DEFAULT_CHAIN_ID);
  
  // Navigation screen - start directly on onboarding if not completed
  const [currentScreen, setCurrentScreen] = useState<NavigationScreen>(() => {
    const storedSettings = secureStorage.getSettings();
    if (!storedSettings.hasCompletedOnboarding) {
      return 'onboarding';
    }
    if (!secureStorage.hasStoredWallet()) {
      return 'welcome';
    }
    return 'dashboard';
  });

  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const previousBalances = useRef<Record<string, number>>({});
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => secureStorage.getTransactions());
  const [marketTokens, setMarketTokens] = useState<MarketToken[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const activeNetwork = useMemo(() => {
    return SUPPORTED_NETWORKS[activeChainId] || SUPPORTED_NETWORKS[DEFAULT_CHAIN_ID];
  }, [activeChainId]);

  // ---- Accounts ----
  const [accounts, setAccounts] = useState<WalletAccount[]>(() => secureStorage.getAccounts());
  const [activeAccountId, setActiveAccountId] = useState<string | null>(() => secureStorage.getActiveAccountId());
  const [contacts, setContacts] = useState<Contact[]>(() => secureStorage.getContacts());
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => secureStorage.getPriceAlerts());
  const [hiddenTokenKeys, setHiddenTokenKeys] = useState<string[]>(() => secureStorage.getHiddenTokens());
  const [fxRates, setFxRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [loadError, setLoadError] = useState(false);
  const [balancesUpdatedAt, setBalancesUpdatedAt] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  // Make sure the first account always mirrors the vault
  useEffect(() => {
    if (!vault) {
      setAccounts([]);
      setActiveAccountId(null);
      return;
    }
    setAccounts((prev) => {
      const base: WalletAccount = {
        id: 'acc_0',
        name: vault.name,
        address: vault.address,
        derivationPath: "m/44'/60'/0'/0/0",
        index: 0,
        createdAt: vault.createdAt,
      };
      // Accounts of additional wallets (vaultId set) are kept untouched; only the primary wallet's first account mirrors `vault`.
      const isPrimaryBase = (a: WalletAccount) => !a.vaultId && (a.index === 0 || a.id === 'acc_0');
      const rest = prev.filter((a) => !isPrimaryBase(a));
      const existingBase = prev.find(isPrimaryBase);
      const next = [existingBase && existingBase.address === vault.address ? existingBase : base, ...rest];
      secureStorage.saveAccounts(next);
      return next;
    });
  }, [vault]);

  const activeAccount = useMemo(
    () => accounts.find((a) => a.id === activeAccountId) || accounts[0] || null,
    [accounts, activeAccountId]
  );

  const activeAddress = activeAccount?.address || vault?.address || '';
  const walletName = activeAccount?.name || vault?.name || 'Main Account';
  const activeVault = useMemo<EncryptedWalletVault | null>(() => {
    if (activeAccount?.vaultId) {
      return extraVaults.find((v) => v.id === activeAccount.vaultId) || null;
    }
    return vault;
  }, [activeAccount, extraVaults, vault]);
  const canAddAccount = !!activeVault && WalletManager.supportsMultipleAccounts(activeVault);

  const fiat = useCallback(
    (usd: number, opts?: { compact?: boolean }) => formatFiat(usd, settings.currency || 'USD', fxRates, opts),
    [settings.currency, fxRates]
  );

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<WalletSettings>) => {
    setSettings((prev) => {
      const updated = secureStorage.saveSettings({ ...prev, ...newSettings });
      return updated;
    });
  }, []);

  const toggleBalanceHidden = useCallback(() => {
    updateSettings({ balanceHidden: !settings.balanceHidden });
  }, [settings.balanceHidden, updateSettings]);

  const switchNetwork = useCallback((chainId: SupportedChainId) => {
    setActiveChainId(chainId);
    updateSettings({ activeChainId: chainId });
    showToast(`Switched network to ${SUPPORTED_NETWORKS[chainId]?.name || 'Unknown'}`, 'info');
  }, [updateSettings, showToast]);

  const renameAccount = useCallback((id: string, name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setAccounts((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, name: clean } : a));
      secureStorage.saveAccounts(next);
      return next;
    });
    if (id === 'acc_0' && vault) {
      const updated = { ...vault, name: clean };
      setVault(updated);
      secureStorage.saveEncryptedVault(updated);
    }
    const target = accounts.find((a) => a.id === id);
    if (target?.vaultId && target.index === 0) {
      setExtraVaults((prev) => {
        const next = prev.map((v) => (v.id === target.vaultId ? { ...v, name: clean } : v));
        secureStorage.saveExtraVaults(next);
        return next;
      });
    }
    showToast('Account renamed', 'success');
  }, [vault, accounts, showToast]);

  const updateWalletName = useCallback((name: string) => {
    if (activeAccount) renameAccount(activeAccount.id, name);
  }, [activeAccount, renameAccount]);

  const switchAccount = useCallback((id: string) => {
    setActiveAccountId(id);
    secureStorage.setActiveAccountId(id);
    setTokens([]);
    previousBalances.current = {};
    showToast('Switched account', 'info');
  }, [showToast]);

  const addAccount = useCallback(async (name: string, passcode: string) => {
    if (!activeVault) throw new Error('No wallet found.');
    if (!WalletManager.supportsMultipleAccounts(activeVault)) {
      throw new Error('Wallets imported from a private key have a single account.');
    }
    const vaultId = activeAccount?.vaultId;
    const siblings = accounts.filter((a) => a.vaultId === vaultId);
    const nextIndex = Math.max(...siblings.map((a) => a.index), 0) + 1;
    const { address, derivationPath } = await WalletManager.deriveAddressAtIndex(activeVault, nextIndex, passcode);
    const account: WalletAccount = {
      id: vaultId ? `${vaultId}_${nextIndex}` : `acc_${nextIndex}`,
      name: name.trim() || `Account ${accounts.length + 1}`,
      address,
      derivationPath,
      index: nextIndex,
      vaultId,
      createdAt: Date.now(),
    };
    const next = [...accounts, account];
    setAccounts(next);
    secureStorage.saveAccounts(next);
    setActiveAccountId(account.id);
    secureStorage.setActiveAccountId(account.id);
    setTokens([]);
    previousBalances.current = {};
    showToast(`${account.name} created`, 'success');
  }, [activeVault, activeAccount, accounts, showToast]);

  const addWallet = useCallback(async ({ mode, name, secret, passcode }: { mode: 'create' | 'import'; name: string; secret: string; passcode: string }) => {
    if (!vault) throw new Error('No wallet found.');
    // All wallets on this device share one passcode: verify it against the primary vault first.
    try {
      await WalletManager.unlockPrivateKey(vault, passcode);
    } catch {
      throw new Error('Incorrect passcode.');
    }
    if (mode === 'create') {
      const val = WalletManager.validateMnemonic(secret);
      if (!val.isValid) throw new Error(val.error || 'Could not generate a recovery phrase. Try again.');
    }
    const { privateKey, mnemonic } = WalletManager.resolveSecret(secret);
    const newVault = await WalletManager.buildVault(name.trim() || `Wallet ${accounts.length + 1}`, privateKey, mnemonic, passcode);
    if (accounts.some((a) => a.address.toLowerCase() === newVault.address.toLowerCase())) {
      throw new Error('This wallet is already in your accounts.');
    }
    const account: WalletAccount = {
      id: `acc_${newVault.id}`,
      name: newVault.name,
      address: newVault.address,
      derivationPath: mnemonic ? WalletManager.pathForIndex(0) : 'imported',
      index: 0,
      vaultId: newVault.id,
      createdAt: Date.now(),
    };
    const nextVaults = [...extraVaults, newVault];
    setExtraVaults(nextVaults);
    secureStorage.saveExtraVaults(nextVaults);
    const nextAccounts = [...accounts, account];
    setAccounts(nextAccounts);
    secureStorage.saveAccounts(nextAccounts);
    setActiveAccountId(account.id);
    secureStorage.setActiveAccountId(account.id);
    setTokens([]);
    previousBalances.current = {};
    showToast(mode === 'create' ? 'New wallet created' : 'Wallet imported', 'success');
  }, [vault, extraVaults, accounts, showToast]);

  const saveContact = useCallback((c: { id?: string; name: string; address: string }) => {
    setContacts((prev) => {
      const entry: Contact = {
        id: c.id || `ct_${Date.now()}`,
        name: c.name.trim(),
        address: c.address.trim(),
        createdAt: Date.now(),
      };
      const next = c.id ? prev.map((x) => (x.id === c.id ? { ...x, ...entry, createdAt: x.createdAt } : x)) : [entry, ...prev];
      secureStorage.saveContacts(next);
      return next;
    });
  }, []);

  const removeContact = useCallback((id: string) => {
    setContacts((prev) => {
      const next = prev.filter((c) => c.id !== id);
      secureStorage.saveContacts(next);
      return next;
    });
  }, []);

  const tokenKey = useCallback((t: { chainId: number; address: string }) => `${t.chainId}:${t.address.toLowerCase()}`, []);

  const toggleTokenHidden = useCallback((t: { chainId: number; address: string }) => {
    const key = `${t.chainId}:${t.address.toLowerCase()}`;
    setHiddenTokenKeys((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      secureStorage.saveHiddenTokens(next);
      return next;
    });
  }, []);

  const addPriceAlert = useCallback((a: Omit<PriceAlert, 'id' | 'createdAt' | 'triggeredAt'>) => {
    setPriceAlerts((prev) => {
      const next = [{ ...a, id: `pa_${Date.now()}`, createdAt: Date.now() }, ...prev];
      secureStorage.savePriceAlerts(next);
      return next;
    });
  }, []);

  const removePriceAlert = useCallback((id: string) => {
    setPriceAlerts((prev) => {
      const next = prev.filter((x) => x.id !== id);
      secureStorage.savePriceAlerts(next);
      return next;
    });
  }, []);

  // Lock & Unlock
  const lockWallet = useCallback(() => {
    setIsUnlocked(false);
    secureStorage.setSessionUnlocked(false);
  }, []);

  const unlockWallet = useCallback(async (pin: string) => {
    if (!vault) return false;
    try {
      await WalletManager.unlockPrivateKey(vault, pin);
      setIsUnlocked(true);
      secureStorage.setSessionUnlocked(true);
      return true;
    } catch {
      return false;
    }
  }, [vault]);

  const removeWallet = useCallback(() => {
    secureStorage.clearWallet();
    setVault(null);
    setExtraVaults([]);
    setIsUnlocked(false);
    setTokens([]);
    setTransactions([]);
    setAccounts([]);
    setContacts([]);
    setHiddenTokenKeys([]);
    setActiveAccountId(null);
    previousBalances.current = {};
    setCurrentScreen('welcome');
    showToast('Wallet removed from device', 'info');
  }, [showToast]);

  // Wallet Creation & Import
  const createWallet = useCallback(async (name: string, phrase: string, pin: string) => {
    const derived = WalletManager.deriveWalletFromMnemonic(phrase);
    const newVault = await WalletManager.createAndSaveVault(name, derived.privateKey, phrase, pin);
    setVault(newVault);
    setIsUnlocked(true);
    updateSettings({ hasCompletedOnboarding: true });
    setCurrentScreen('dashboard');
    showToast('New wallet created securely!', 'success');
  }, [updateSettings, showToast]);

  const importWallet = useCallback(async (name: string, phraseOrKey: string, pin: string) => {
    const clean = phraseOrKey.trim();
    let privateKey = '';
    let mnemonic: string | undefined = undefined;

    if (clean.includes(' ')) {
      // Mnemonic phrase
      const val = WalletManager.validateMnemonic(clean);
      if (!val.isValid) {
        throw new Error(val.error || 'Invalid mnemonic phrase');
      }
      const derived = WalletManager.deriveWalletFromMnemonic(clean);
      privateKey = derived.privateKey;
      mnemonic = derived.mnemonic;
    } else {
      // Private key
      const imported = WalletManager.importFromPrivateKey(clean);
      privateKey = imported.privateKey;
    }

    const newVault = await WalletManager.createAndSaveVault(name, privateKey, mnemonic, pin);
    setVault(newVault);
    setIsUnlocked(true);
    updateSettings({ hasCompletedOnboarding: true });
    setCurrentScreen('dashboard');
    showToast('Wallet imported successfully!', 'success');
  }, [updateSettings, showToast]);

  // Refresh Market Data
  const refreshMarket = useCallback(async () => {
    setIsLoadingMarket(true);
    try {
      const data = await marketService.getMarketOverview(true);
      setMarketTokens(data);
    } catch {
      // Handled silently
    } finally {
      setIsLoadingMarket(false);
    }
  }, []);

  // Refresh Balances
  const refreshBalances = useCallback(async () => {
    if (!activeAddress) {
      setTokens([]);
      return;
    }

    setIsLoadingBalances(true);
    let hadError = false;
    try {
      // Get base token list for active chain
      const defaultChainTokens = DEFAULT_TOKENS[activeChainId] || [];
      const customChainTokens = secureStorage.getCustomTokens().filter((t) => t.chainId === activeChainId);
      const allTokensList = [...defaultChainTokens, ...customChainTokens];

      // Refresh market prices simultaneously
      try {
        const marketData = await marketService.getMarketOverview();
        setMarketTokens(marketData);
      } catch (err) {
        hadError = true;
        console.error('Market data unavailable:', err);
      }

      // Price alerts: evaluate against the freshest prices we have
      {
        const alerts = secureStorage.getPriceAlerts();
        let changed = false;
        const nowTs = Date.now();
        const evaluated = alerts.map((al) => {
          if (al.triggeredAt) return al;
          const price = marketService.getPriceForToken(al.assetId).priceUSD;
          if (price <= 0) return al;
          const hit = al.direction === 'above' ? price >= al.target : price <= al.target;
          if (!hit) return al;
          changed = true;
          const msg = `${al.symbol} is ${al.direction === 'above' ? 'above' : 'below'} $${al.target.toLocaleString('en-US')} (now $${price.toLocaleString('en-US', { maximumFractionDigits: 4 })})`;
          showToast(msg, 'info');
          if (secureStorage.getSettings().notificationsEnabled) systemNotify('Price alert', msg);
          return { ...al, triggeredAt: nowTs };
        });
        if (changed) {
          secureStorage.savePriceAlerts(evaluated);
          setPriceAlerts(evaluated);
        }
      }

      await marketService.fetchExtraPrices(allTokensList.map((t) => t.coingeckoId || '').filter(Boolean));

      const cached = secureStorage.getBalanceCache(activeAddress, activeChainId);
      const balancePromises = allTokensList.map(async (meta): Promise<TokenBalance> => {
        let balanceFormatted = '0.0';
        let balanceRaw = '0';

        let stale = false;
        // A failing RPC call keeps the last known balance (flagged stale) instead of showing a false zero.
        try {
          if (meta.address === 'native') {
            balanceFormatted = await rpcService.getNativeBalance(activeChainId, activeAddress);
            balanceRaw = '0';
          } else {
            const res = await TokenService.getTokenBalance(
              activeChainId,
              meta.address,
              activeAddress,
              meta.decimals
            );
            balanceFormatted = res.formatted;
            balanceRaw = res.raw;
          }
        } catch (err) {
          hadError = true;
          console.error(`Balance unavailable for ${meta.symbol}:`, err);
          const prevEntry = cached?.tokens.find((c) => c.address.toLowerCase() === meta.address.toLowerCase());
          if (prevEntry) {
            balanceFormatted = prevEntry.balance;
            balanceRaw = prevEntry.balanceRaw;
            stale = true;
          }
        }

        const priceInfo = marketService.getPriceForToken(meta.coingeckoId || meta.symbol);
        const balNum = parseFloat(balanceFormatted) || 0;
        const fiatValueUSD = balNum * priceInfo.priceUSD;

        return {
          ...meta,
          balance: balanceFormatted,
          balanceRaw,
          fiatValueUSD,
          priceUSD: priceInfo.priceUSD,
          priceChange24h: priceInfo.change24h,
          stale,
        };
      });

      const resolved = await Promise.all(balancePromises);
      setTokens(resolved);
      setLoadError(hadError);
      setBalancesUpdatedAt(hadError ? cached?.at ?? null : Date.now());
      if (!hadError) {
        secureStorage.saveBalanceCache(activeAddress, activeChainId, resolved);
        const total = resolved.reduce((sum, t) => sum + t.fiatValueUSD, 0);
        // Only record history for chain-agnostic totals once per refresh of the active chain.
        secureStorage.recordPortfolioPoint(`${activeAddress}:${activeChainId}`, total);
      }

      // Detect incoming funds (balance went up since the last successful refresh)
      const prev = previousBalances.current;
      const next: Record<string, number> = {};
      resolved.forEach((t) => {
        const key = `${activeAddress}:${t.chainId}:${t.address.toLowerCase()}`;
        const bal = parseFloat(t.balance) || 0;
        next[key] = bal;
        if (key in prev && bal > prev[key] + 1e-12) {
          const diff = bal - prev[key];
          const msg = `Received ${diff.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${t.symbol}`;
          showToast(msg, 'success');
          if (secureStorage.getSettings().notificationsEnabled) systemNotify('Funds received', msg);
        }
      });
      previousBalances.current = next;
    } catch (err) {
      setLoadError(true);
      console.error('Error fetching balances:', err);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [activeAddress, activeChainId, showToast]);

  // Add custom token
  const addCustomToken = useCallback(async (token: TokenMetadata) => {
    secureStorage.saveCustomToken(token);
    showToast(`Added token ${token.symbol}`, 'success');
    await refreshBalances();
  }, [refreshBalances, showToast]);

  const removeCustomToken = useCallback((address: string) => {
    secureStorage.removeCustomToken(activeChainId, address);
    showToast('Custom token removed', 'info');
    refreshBalances();
  }, [activeChainId, refreshBalances, showToast]);

  const addTransaction = useCallback((tx: WalletTransaction) => {
    secureStorage.saveTransaction(tx);
    setTransactions(secureStorage.getTransactions());
  }, []);

  // Live FX rates (cached for 6h)
  useEffect(() => {
    let cancelled = false;
    loadRates().then((r) => !cancelled && setFxRates(r));
    return () => {
      cancelled = true;
    };
  }, []);

  // Connectivity
  useEffect(() => {
    const on = () => {
      setIsOnline(true);
      refreshBalances();
    };
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Transaction receipt updates (pending -> confirmed)
  useEffect(() => {
    const handler = (e: Event) => {
      const { status } = (e as CustomEvent).detail || {};
      setTransactions(secureStorage.getTransactions());
      const msg = status === 'confirmed' ? 'Transaction confirmed' : 'Transaction failed';
      showToast(msg, status === 'confirmed' ? 'success' : 'error');
      if (secureStorage.getSettings().notificationsEnabled) systemNotify(msg, 'Open the wallet to see the details.');
      refreshBalances();
    };
    window.addEventListener('wallet:tx-updated', handler);
    return () => window.removeEventListener('wallet:tx-updated', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast]);

  // Initial loads and auto-refresh interval
  useEffect(() => {
    refreshMarket();
  }, [refreshMarket]);

  // Show cached balances immediately, then refresh from the network.
  useEffect(() => {
    if (!activeAddress) return;
    const cached = secureStorage.getBalanceCache(activeAddress, activeChainId);
    if (cached) {
      setTokens(cached.tokens.map((t) => ({ ...t, stale: true })));
      setBalancesUpdatedAt(cached.at);
    } else {
      setTokens([]);
      setBalancesUpdatedAt(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChainId, activeAddress]);

  useEffect(() => {
    refreshBalances();
    setTransactions(secureStorage.getTransactions());
  }, [activeChainId, activeAddress, refreshBalances]);

  // Periodic price/balance refresh
  useEffect(() => {
    const intervalMs = (settings.refreshIntervalSeconds || 30) * 1000;
    const timer = setInterval(() => {
      refreshBalances();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [settings.refreshIntervalSeconds, refreshBalances]);

  const visibleTokens = useMemo(
    () => tokens.filter((t) => !hiddenTokenKeys.includes(`${t.chainId}:${t.address.toLowerCase()}`)),
    [tokens, hiddenTokenKeys]
  );

  // Calculate total portfolio value and weighted 24h change
  const { totalPortfolioUSD, portfolioChange24h } = useMemo(() => {
    let total = 0;
    let weightedChange = 0;

    tokens.forEach((t) => {
      total += t.fiatValueUSD;
    });

    if (total > 0) {
      tokens.forEach((t) => {
        const weight = t.fiatValueUSD / total;
        weightedChange += t.priceChange24h * weight;
      });
    }

    return {
      totalPortfolioUSD: total,
      portfolioChange24h: weightedChange,
    };
  }, [tokens]);

  return (
    <WalletContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        selectedToken,
        setSelectedToken,
        selectedTx,
        setSelectedTx,
        vault,
        isUnlocked,
        activeAddress,
        walletName,
        createWallet,
        importWallet,
        lockWallet,
        unlockWallet,
        removeWallet,
        updateWalletName,
        accounts,
        activeAccount,
        canAddAccount,
        activeVault,
        addWallet,
        addAccount,
        switchAccount,
        renameAccount,
        contacts,
        saveContact,
        removeContact,
        activeChainId,
        activeNetwork,
        switchNetwork,
        tokens,
        totalPortfolioUSD,
        portfolioChange24h,
        isLoadingBalances,
        refreshBalances,
        visibleTokens,
        hiddenTokenKeys,
        tokenKey,
        toggleTokenHidden,
        loadError,
        balancesUpdatedAt,
        isOnline,
        addCustomToken,
        removeCustomToken,
        priceAlerts,
        addPriceAlert,
        removePriceAlert,
        transactions,
        addTransaction,
        marketTokens,
        isLoadingMarket,
        refreshMarket,
        settings,
        updateSettings,
        toggleBalanceHidden,
        fiat,
        toast,
        showToast,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
