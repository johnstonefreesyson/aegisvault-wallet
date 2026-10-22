export type SupportedChainId = 1 | 56 | 137 | 42161 | 10 | 8453 | 43114 | 11155111;

export interface BlockchainNetwork {
  id: string;
  chainId: SupportedChainId;
  name: string;
  shortName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrl: string;
  icon: string;
  color: string;
  isTestnet?: boolean;
}

export interface TokenMetadata {
  address: string; // '0x0' or 'native' for native coin
  chainId: SupportedChainId;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
  isCustom?: boolean;
  coingeckoId?: string;
}

export interface TokenBalance extends TokenMetadata {
  balance: string; // formatted decimal string
  balanceRaw: string; // raw BigInt string
  fiatValueUSD: number;
  priceUSD: number;
  priceChange24h: number;
  /** true when the balance is the last cached value because a fresh fetch failed. */
  stale?: boolean;
}

export interface PortfolioPoint {
  t: number;
  usd: number;
}

export interface PriceAlert {
  id: string;
  /** CoinGecko id (or symbol) used to look the price up */
  assetId: string;
  symbol: string;
  direction: 'above' | 'below';
  /** target price in USD */
  target: number;
  createdAt: number;
  triggeredAt?: number;
}

export interface WalletAccount {
  id: string;
  name: string;
  address: string;
  derivationPath: string;
  /** HD index (m/44'/60'/0'/0/index). Imported private-key wallets only have index 0. */
  index: number;
  /**
   * Which wallet (vault) this account belongs to. Undefined = the primary wallet created/imported during
   * setup; otherwise the id of an additional wallet added later (created or imported).
   */
  vaultId?: string;
  createdAt: number;
}

export interface Contact {
  id: string;
  name: string;
  address: string;
  createdAt: number;
}

export type GasSpeed = 'slow' | 'normal' | 'fast';
export type FiatCurrency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'NGN' | 'CAD' | 'AUD' | 'INR' | 'ZAR';

export interface EncryptedWalletVault {
  version: number;
  id: string;
  name: string;
  address: string;
  encryptedMnemonic?: string; // AES-GCM encrypted
  encryptedPrivateKey: string; // AES-GCM encrypted
  salt: string;
  iv: string;
  /** PBKDF2 iterations used for this vault (absent = legacy 100k). */
  kdfIterations?: number;
  /** The mnemonic is encrypted with its own salt/iv. */
  mnemonicSalt?: string;
  mnemonicIv?: string;
  hasMnemonic: boolean;
  createdAt: number;
}

export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'reverted';
export type TransactionType = 'send' | 'receive' | 'contract_call';

export interface WalletTransaction {
  hash: string;
  chainId: SupportedChainId;
  from: string;
  to: string;
  amount: string;
  symbol: string;
  tokenAddress?: string;
  timestamp: number;
  status: TransactionStatus;
  type: TransactionType;
  gasUsed?: string;
  gasFeeEth?: string;
  gasFeeUSD?: number;
  blockNumber?: number;
  errorMessage?: string;
  nonce?: number;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  /** hash of the transaction that replaced this one (speed up / cancel) */
  replacedBy?: string;
}

/** User-entered fee override in gwei. */
export interface CustomFee {
  maxFeeGwei: string;
  priorityGwei: string;
}

export interface GasFeeEstimate {
  gasLimit: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasPrice?: string;
  estimatedFeeNative: string;
  estimatedFeeUSD: number;
}

export interface MarketToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface WalletSettings {
  currency: FiatCurrency;
  /** 0 = lock as soon as the app is left/hidden. */
  autoLockMinutes: number;
  balanceHidden: boolean;
  refreshIntervalSeconds: number;
  notificationsEnabled: boolean;
  gasSpeed: GasSpeed;
  developerMode: boolean;
  activeChainId: SupportedChainId;
  hasCompletedOnboarding: boolean;
  theme: 'dark' | 'light' | 'system';
}

export type NavigationScreen =
  | 'splash'
  | 'onboarding'
  | 'welcome'
  | 'create_wallet'
  | 'verify_seed'
  | 'import_wallet'
  | 'dashboard'
  | 'network_selector'
  | 'token_list'
  | 'token_details'
  | 'send'
  | 'send_confirm'
  | 'receive'
  | 'transactions'
  | 'transaction_details'
  | 'portfolio'
  | 'market'
  | 'add_token'
  | 'contacts'
  | 'backup_seed'
  | 'address_view'
  | 'settings'
  | 'security_settings'
  | 'legal_privacy'
  | 'approvals'
  | 'swap'
  | 'nfts'
  | 'price_alerts'
  | 'walletconnect'
  | 'multichain'
  | 'staking'
  | 'bridge'
  | 'security_scanner';
