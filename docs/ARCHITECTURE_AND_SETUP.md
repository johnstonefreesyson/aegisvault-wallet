# AegisVault: Multi-Chain Crypto Wallet Architecture & Production Manual

## 1. System Overview
**AegisVault** is a non-custodial, multi-chain cryptocurrency wallet engineered for Ethereum, BNB Smart Chain, Polygon PoS, and EVM-compatible networks.

### Core Architecture Highlights:
* **True Non-Custodial Security**: 100% client-side key generation via BIP-39 and standard BIP-44 HD derivation (`m/44'/60'/0'/0/0`).
* **Cryptographic Vault**: AES-GCM 256-bit encryption with PBKDF2 key derivation (100,000 iterations, SHA-256) via the Web Crypto API on Web, and iOS Keychain / Android KeyStore on native mobile.
* **Multi-Chain RPC Management**: Configured with automated fallback RPC endpoints for Ethereum (Chain ID 1), BNB Smart Chain (Chain ID 56), Polygon (Chain ID 137), and Ethereum Sepolia Testnet (Chain ID 11155111).
* **Live On-Chain Interaction**: Real-time balance queries for native coins and ERC-20 tokens, dynamic EIP-1559 gas estimation, and local offline transaction signing prior to broadcast.
* **Live Market Intelligence**: Integrated with CoinGecko's REST API for live token prices, 24-hour price changes, trading volume, and market rankings.

---

## 2. Directory Structure
```
├── src/                          # Interactive Web Application & Simulator
│   ├── config/networks.ts        # RPCs, chain IDs, explorers, ERC-20 ABI
│   ├── services/
│   │   ├── blockchain/          # RPC providers, WalletManager, TokenService, TransactionService
│   │   ├── storage/             # WebCrypto AES-GCM utils & secure storage
│   │   └── market/              # CoinGecko integration & price engine
│   ├── store/WalletContext.tsx   # Centralized reactive state provider
│   ├── components/
│   │   ├── common/              # Header, BottomTabBar, QRDisplay, TokenIcon, Toast
│   │   ├── screens/             # 23 complete screens & flow modals
│   │   └── mobile/MobileFrame.tsx # Interactive iPhone/Android simulator frame
│   └── tests/wallet.test.ts     # Automated unit test suite
├── backend/                      # NestJS / Express Microservice Source
│   ├── src/
│   │   ├── modules/
│   │   │   ├── health/          # Service status & non-custodial proof
│   │   │   ├── networks/        # Chain metadata controller
│   │   │   ├── market/          # Market proxy & cache
│   │   │   └── blockchain/      # Non-custodial RPC proxy & broadcaster
│   │   └── main.ts              # API Server entry point
│   └── package.json
├── mobile/                       # React Native CLI Source Code
│   ├── src/services/storage/    # Hardware-backed KeyStore/Keychain integration
│   ├── App.tsx                  # Native App entry point
│   └── package.json
└── docs/                         # Security & Build Manuals
```

---

## 3. Cryptographic & Security Model

1. **Zero Secret Transmission**: Private keys, seed phrases, and passwords are never transmitted across the network or logged in telemetry.
2. **Local Key Derivation**: Wallets derive addresses from random 128-bit entropy (`ethers.randomBytes(16)`) adhering to BIP-39 and RFC-5869.
3. **Local Offline Signing**: Transactions are constructed and signed locally by the decrypted `ethers.Wallet` instance before the hex payload is broadcasted.
4. **Scam Token Defense**: Custom tokens require on-chain contract verification (`name()`, `symbol()`, `decimals()`) before addition, with explicit duplicate protection and safety notices.
5. **Irreversible Action Guardrails**: Erasing or resetting a wallet requires explicit typed confirmation ("DELETE") and backup validation.

---

## 4. Mobile Build Instructions

### Android Build (React Native CLI)
```bash
cd mobile
npm install

# Build debug APK
npx react-native run-android

# Generate release bundle (AAB)
cd android
./gradlew bundleRelease
```
*Output APK located in*: `android/app/build/outputs/apk/release/app-release.apk`

### iOS Build (React Native CLI)
```bash
cd mobile
npm install
cd ios && pod install && cd ..

# Run in iOS Simulator
npx react-native run-ios --simulator="iPhone 15 Pro"

# Build archive for App Store
xcodebuild -workspace AegisVaultMobile.xcworkspace -scheme AegisVaultMobile -configuration Release archive
```

---

## 5. Backend Deployment Instructions
```bash
cd backend
npm install
npm run build
npm start
```
The backend runs on port 4000 (or `process.env.PORT`). It proxies public RPC endpoints and market data, safeguarding your server from CORS rate limits.

---

## 6. External Service Dependencies & Config
* **Ethereum RPC**: Cloudflare ETH (`https://cloudflare-eth.com`), Ankr (`https://rpc.ankr.com/eth`).
* **BNB Smart Chain RPC**: Binance LlamaRPC (`https://binance.llamarpc.com`).
* **Polygon PoS RPC**: Polygon-RPC (`https://polygon-rpc.com`).
* **Sepolia Testnet RPC**: Sepolia Org (`https://rpc.sepolia.org`).
* **Market Prices**: CoinGecko v3 Public API (`https://api.coingecko.com/api/v3`).
