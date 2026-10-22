# Security Notes & Hardening Report

This document details the security posture, cryptographic controls, and threat mitigations implemented in AegisVault.

## Core Protections Implemented

### 1. Cryptographic Isolation & Key Derivation
- Private keys and recovery phrases are encrypted with **AES-GCM (256-bit)**.
- Encryption keys are derived using **PBKDF2-HMAC-SHA256 with 600,000 iterations** (exceeding OWASP guidelines) using client-side Web Crypto API (`crypto.subtle`).
- Keys are never persisted in plaintext, never written to disk unencrypted, and decrypted only ephemerally in volatile memory at the precise moment of transaction signing.
- Unique cryptographically secure 16-byte salt and 12-byte IV are generated for each vault and recovery phrase backup.

### 2. Strict Content Security Policy (CSP) & Zero Third-Party Script Leakage
- Strict meta CSP header enforces:
  ```http
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
  img-src 'self' data: https: blob:;
  connect-src 'self' https: wss:;
  object-src 'none';
  base-uri 'self';
  frame-src 'self' https://global.transak.com https://buy.moonpay.com https://app.ramp.network https://verify.walletconnect.org https://verify.walletconnect.com;
  ```
- All web fonts and typography utilize self-contained and local system stacks. No telemetry scripts, external tracker beacons, or external CDN scripts are loaded.

### 3. Unlock Throttling & Exponential Back-Off
- Local brute-force attacks are mitigated through persistent attempt tracking and exponential back-off delays:
  - 1–2 failed attempts: Instant retry.
  - 3–4 failed attempts: 15-second mandatory cooldown.
  - 5–7 failed attempts: 60-second mandatory cooldown.
  - 8–9 failed attempts: 300-second (5 minute) lock with security warning.
  - 10+ failed attempts: 900-second (15 minute) lock with recovery reset alert.
- Countdown timers prevent automated rapid submission.

### 4. Strong Passcode & Entropy Validation
- Passcodes are strictly evaluated for length (minimum 8 characters), character diversity (uppercase, lowercase, numbers, symbols), repetition, and sequential patterns.
- Blacklists common weak PINs (`123456`, `000000`, `password`, `qwerty`, etc.).
- Real-time visual entropy meter informs the user of their password strength before vault creation or import.

### 5. Multi-Chain Signing & Verification
- Supports native offline derivation and signing for:
  - **Ethereum & EVMs**: BIP-44 (`m/44'/60'/0'/0/0`)
  - **Bitcoin**: Native SegWit Bech32 (`m/84'/0'/0'/0/0`) and Legacy (`m/44'/0'/0'/0/0`)
  - **Solana**: Ed25519 (`m/44'/501'/0'/0'`)
  - **Tron**: Base58Check (`m/44'/195'/0'/0/0`)
  - **Cosmos**: Bech32 (`m/44'/118'/0'/0/0`)
- Validates addresses and checksums before broadcasting.

### 6. WalletConnect v2 & dApp Approval Security
- Reown/WalletConnect v2 integration with explicit domain verification, chain validation, and clear method authorization.
- `personal_sign`, `eth_signTypedData_v4` (EIP-712), and `eth_sendTransaction` are decoded into human-readable parameters before any signature can be granted.
- Displays clear origin dApp identity, icon, and URL to defend against deceptive phishing spoofing.

### 7. Pre-Signing Transaction Simulation & Risk Scanner
- Simulates expected asset changes (net tokens in / tokens out) before signing.
- Inspects contract code for high buy/sell taxes, unverified source, honeypot patterns, address poisoning, and infinite approval drainers.

### 8. Hardware Wallet Isolation
- WebUSB / WebHID transport support for Ledger (Nano S / X / S Plus / Stax) and Trezor (Model T / Safe 3), ensuring private keys never touch browser memory.
