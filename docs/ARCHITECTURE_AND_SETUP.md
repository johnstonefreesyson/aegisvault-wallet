# AegisVault: Multi-Chain Crypto Wallet Architecture & Production Manual

## 1. System Overview
**AegisVault** is a non-custodial, production-grade multi-chain cryptocurrency wallet engineered for Ethereum, BNB Smart Chain, Polygon PoS, Arbitrum, Optimism, Base, Avalanche, Bitcoin, Solana, Tron, and Cosmos.

### Core Architecture Highlights:
* **True Non-Custodial Security**: 100% client-side key generation via BIP-39 and standardized multi-chain derivation:
  - Ethereum / EVM: `m/44'/60'/0'/0/0`
  - Bitcoin: `m/84'/0'/0'/0/0` (Native SegWit `bc1q...`) & `m/44'/0'/0'/0/0`
  - Solana: `m/44'/501'/0'/0'` (Ed25519)
  - Tron: `m/44'/195'/0'/0/0`
  - Cosmos: `m/44'/118'/0'/0/0`
* **Cryptographic Vault**: AES-GCM 256-bit encryption with PBKDF2 key derivation (600,000 iterations, SHA-256) via the Web Crypto API.
* **Strict CSP & Self-Contained Assets**: Tight Content-Security-Policy with zero external font or script CDN dependencies.
* **Unlock Throttling**: Exponential back-off protection against brute-force attacks (15s to 15m lockouts).
* **WalletConnect v2 (Reown WalletKit)**: Full dApp connection suite with session proposal approvals, method permission filters, and visual decoding for `personal_sign`, EIP-712 typed data, and transaction requests.
* **Multi-Provider Fiat On-Ramp / Off-Ramp**: Integrated Transak, MoonPay, and Ramp widgets for buying and cashing out crypto with rate comparisons and payment method filtering.
* **Native & Liquid Staking Engine**: Staking workflows for Solana, Cosmos, BNB Chain, and Tron, alongside Lido stETH and Rocket Pool rETH liquid staking.
* **Cross-Chain Bridge Aggregator**: LI.FI bridge route optimization alongside same-chain decentralized exchange swaps.
* **Security Extras**: Token & address risk scanner, pre-signing asset balance simulation, and Ledger/Trezor WebUSB/WebHID hardware wallet connectivity.

---

## 2. Directory Structure
```
├── src/                          # Interactive Web Application & Simulator
│   ├── config/networks.ts        # RPCs, chain IDs, explorers, ERC-20 & native configs
│   ├── services/
│   │   ├── blockchain/          # RPC providers, WalletManager, TokenService, TransactionService
│   │   ├── blockchain/multichain/ # Bitcoin, Solana, Tron, Cosmos derivation & signing
│   │   ├── walletconnect/       # WalletConnect v2 pairing, sessions, signing modals
│   │   ├── staking/             # Validators, APY tracking, delegate/unstake services
│   │   ├── bridge/              # LI.FI cross-chain bridge aggregation
│   │   ├── security/            # Token risk scanner & transaction simulator
│   │   ├── hardware/            # Ledger & Trezor WebUSB/WebHID hardware transports
│   │   ├── storage/             # WebCrypto AES-GCM utils, unlock throttle, secure storage
│   │   └── market/              # CoinGecko integration & price engine
│   ├── store/WalletContext.tsx   # Centralized reactive state provider
│   ├── components/
│   │   ├── common/              # Header, BottomTabBar, QRDisplay, TokenIcon, Toast
│   │   └── screens/             # Comprehensive screen flows (Dashboard, WalletConnect, Staking, Buy/Sell, Bridge, Security Scanner, etc.)
│   └── tests/                   # Automated unit & integration test suites
├── backend/                      # Node.js API Service Source
│   ├── src/
│   │   ├── modules/             # Health, networks, market, and blockchain RPC proxies
│   │   └── main.ts              # API Server entry point
│   └── package.json
└── docs/                         # Security & Architecture Documentation
```

---

## 3. Cryptographic & Security Model

1. **Zero Secret Transmission**: Private keys, seed phrases, and passcodes are never transmitted across any network or logged.
2. **Local Key Derivation**: Wallets derive addresses from random 128-bit entropy (`ethers.randomBytes(16)`) adhering to BIP-39 and RFC-5869.
3. **Local Offline Signing**: Transactions are constructed, simulated, and signed locally by the decrypted wallet instance before broadcast.
4. **Scam Defense & Risk Scanning**: Real-time contract verification, honeypot tax checks, address poisoning lookalike detection, and transaction simulation before signature.
5. **Unlock Throttling**: Exponential back-off timers block automated PIN guesses.
