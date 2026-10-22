import { EncryptedWalletVault, WalletSettings, TokenMetadata, WalletTransaction, WalletAccount, Contact, TokenBalance, PortfolioPoint, PriceAlert } from '../../types';
import { encryptSecret, decryptSecret } from './cryptoUtils';

const STORAGE_KEYS = {
  VAULT: 'aegisvault_encrypted_vault',
  EXTRA_VAULTS: 'aegisvault_extra_vaults',
  ACCOUNTS: 'aegisvault_accounts',
  SETTINGS: 'aegisvault_settings',
  CUSTOM_TOKENS: 'aegisvault_custom_tokens',
  TRANSACTIONS: 'aegisvault_transactions',
  SESSION_LOCK: 'aegisvault_session_lock',
  ACTIVE_ACCOUNT: 'aegisvault_active_account',
  CONTACTS: 'aegisvault_contacts',
  HIDDEN_TOKENS: 'aegisvault_hidden_tokens',
  FX_CACHE: 'aegisvault_fx_cache',
  BALANCE_CACHE: 'aegisvault_balance_cache',
  PORTFOLIO_HISTORY: 'aegisvault_portfolio_history',
  PRICE_ALERTS: 'aegisvault_price_alerts',
};

export const DEFAULT_SETTINGS: WalletSettings = {
  currency: 'USD',
  autoLockMinutes: 15,
  balanceHidden: false,
  refreshIntervalSeconds: 30,
  notificationsEnabled: false,
  gasSpeed: 'normal',
  developerMode: false,
  activeChainId: 1,
  hasCompletedOnboarding: false,
  theme: 'light',
};

class SecureStorageService {
  // Vault operations
  saveEncryptedVault(vault: EncryptedWalletVault): void {
    localStorage.setItem(STORAGE_KEYS.VAULT, JSON.stringify(vault));
  }

  getEncryptedVault(): EncryptedWalletVault | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VAULT);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // Additional wallets (each its own encrypted vault with its own recovery phrase / private key)
  getExtraVaults(): EncryptedWalletVault[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXTRA_VAULTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveExtraVaults(vaults: EncryptedWalletVault[]): void {
    localStorage.setItem(STORAGE_KEYS.EXTRA_VAULTS, JSON.stringify(vaults));
  }

  hasStoredWallet(): boolean {
    return localStorage.getItem(STORAGE_KEYS.VAULT) !== null;
  }

  clearWallet(): void {
    localStorage.removeItem(STORAGE_KEYS.VAULT);
    localStorage.removeItem(STORAGE_KEYS.EXTRA_VAULTS);
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_TOKENS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ACCOUNT);
    localStorage.removeItem(STORAGE_KEYS.CONTACTS);
    localStorage.removeItem(STORAGE_KEYS.HIDDEN_TOKENS);
    localStorage.removeItem(STORAGE_KEYS.BALANCE_CACHE);
    localStorage.removeItem(STORAGE_KEYS.PORTFOLIO_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.PRICE_ALERTS);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_LOCK);
  }

  // Accounts (public data only: names + addresses)
  getAccounts(): WalletAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveAccounts(accounts: WalletAccount[]): void {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }

  getActiveAccountId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT);
  }

  setActiveAccountId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, id);
  }

  // Address book
  getContacts(): Contact[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveContacts(contacts: Contact[]): void {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  }

  // Hidden tokens (keys look like `${chainId}:${address}`)
  getHiddenTokens(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HIDDEN_TOKENS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveHiddenTokens(keys: string[]): void {
    localStorage.setItem(STORAGE_KEYS.HIDDEN_TOKENS, JSON.stringify(keys));
  }

  // Balance cache (public data: balances per address+chain, shown instantly while the network refreshes)
  getBalanceCache(address: string, chainId: number): { tokens: TokenBalance[]; at: number } | null {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.BALANCE_CACHE) || '{}');
      return all[`${address.toLowerCase()}:${chainId}`] || null;
    } catch {
      return null;
    }
  }

  saveBalanceCache(address: string, chainId: number, tokens: TokenBalance[]): void {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.BALANCE_CACHE) || '{}');
      all[`${address.toLowerCase()}:${chainId}`] = { tokens: tokens.map((t) => ({ ...t, stale: undefined })), at: Date.now() };
      localStorage.setItem(STORAGE_KEYS.BALANCE_CACHE, JSON.stringify(all));
    } catch {
      /* storage full or unavailable: caching is best-effort */
    }
  }

  // Portfolio value history (USD), per address. One point per 30+ minutes, capped.
  getPortfolioHistory(address: string): PortfolioPoint[] {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIO_HISTORY) || '{}');
      return all[address.toLowerCase()] || [];
    } catch {
      return [];
    }
  }

  recordPortfolioPoint(address: string, usd: number): void {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIO_HISTORY) || '{}');
      const key = address.toLowerCase();
      const list: PortfolioPoint[] = all[key] || [];
      const last = list[list.length - 1];
      const now = Date.now();
      if (last && now - last.t < 30 * 60 * 1000) {
        last.t = now;
        last.usd = usd;
      } else {
        list.push({ t: now, usd });
      }
      all[key] = list.slice(-1500);
      localStorage.setItem(STORAGE_KEYS.PORTFOLIO_HISTORY, JSON.stringify(all));
    } catch {
      /* best-effort */
    }
  }

  // Price alerts
  getPriceAlerts(): PriceAlert[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRICE_ALERTS) || '[]');
    } catch {
      return [];
    }
  }

  savePriceAlerts(alerts: PriceAlert[]): void {
    localStorage.setItem(STORAGE_KEYS.PRICE_ALERTS, JSON.stringify(alerts));
  }

  // FX cache
  getFxCache(): { rates: Record<string, number>; fetchedAt: number } | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FX_CACHE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  saveFxCache(rates: Record<string, number>): void {
    localStorage.setItem(STORAGE_KEYS.FX_CACHE, JSON.stringify({ rates, fetchedAt: Date.now() }));
  }

  // Settings operations
  getSettings(): WalletSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: Partial<WalletSettings>): WalletSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  // Custom tokens
  getCustomTokens(): TokenMetadata[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_TOKENS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveCustomToken(token: TokenMetadata): void {
    const list = this.getCustomTokens();
    const exists = list.some(
      (t) => t.chainId === token.chainId && t.address.toLowerCase() === token.address.toLowerCase()
    );
    if (!exists) {
      list.push(token);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_TOKENS, JSON.stringify(list));
    }
  }

  removeCustomToken(chainId: number, address: string): void {
    const list = this.getCustomTokens().filter(
      (t) => !(t.chainId === chainId && t.address.toLowerCase() === address.toLowerCase())
    );
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TOKENS, JSON.stringify(list));
  }

  // Transactions
  getTransactions(): WalletTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveTransaction(tx: WalletTransaction): void {
    const current = this.getTransactions();
    const existingIndex = current.findIndex((t) => t.hash.toLowerCase() === tx.hash.toLowerCase());
    if (existingIndex >= 0) {
      current[existingIndex] = tx;
    } else {
      current.unshift(tx);
    }
    // Limit to latest 100 txs
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(current.slice(0, 100)));
  }

  updateTransactionStatus(hash: string, status: WalletTransaction['status'], blockNumber?: number): void {
    const current = this.getTransactions();
    const target = current.find((t) => t.hash.toLowerCase() === hash.toLowerCase());
    if (target) {
      target.status = status;
      if (blockNumber) target.blockNumber = blockNumber;
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(current));
    }
  }

  // Session lock state
  isSessionUnlocked(): boolean {
    return sessionStorage.getItem(STORAGE_KEYS.SESSION_LOCK) === 'unlocked';
  }

  setSessionUnlocked(unlocked: boolean): void {
    if (unlocked) {
      sessionStorage.setItem(STORAGE_KEYS.SESSION_LOCK, 'unlocked');
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_LOCK);
    }
  }
}

export const secureStorage = new SecureStorageService();
export { encryptSecret, decryptSecret };
