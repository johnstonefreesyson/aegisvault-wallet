# Security notes

This is a self-review written while building the app. It is **not** an independent audit.
Get one before real funds are involved.

## What the app does
- Private keys and recovery phrases are encrypted with AES-GCM; the key is derived from your passcode with
  PBKDF2-SHA256 (**600,000 iterations** for new wallets).
- Keys are decrypted only at the moment of signing (or when revealing the phrase / deriving a new account),
  and are never written back to storage.
- Auto-lock: after inactivity (1/5/15/30 min) or as soon as the app is left ("On leaving").
- Send checks: invalid / zero / own address are blocked; token-contract, smart-contract, first-time and
  look-alike ("address poisoning") recipients require an explicit acknowledgement.

## Fixed during this pass
- The recovery phrase was encrypted with a salt/IV that was never saved, so **Backup Phrase** could never
  decrypt it. Fixed for wallets created from now on (covered by a regression test).
  Wallets created with the old build keep working for signing, but their phrase cannot be revealed:
  restore them from your own backup to get the fixed format.
- `bip39` relied on Node's `Buffer` and rejected valid phrases in the browser. Replaced with ethers' BIP-39.

## Known limitations / recommended next steps
1. **Old vaults keep 100k PBKDF2 iterations** until the wallet is re-created from its phrase.
2. **No unlock throttling.** Anyone with the device can try passcodes (each try costs ~0.3 s of KDF time).
   Add exponential back-off and an optional wipe-after-N-failures.
3. **The "unlocked" flag is a UI gate** stored in `sessionStorage`; the real protection is that keys stay encrypted.
4. **XSS = game over for a web wallet.** Ship a strict Content-Security-Policy, pin dependencies, and avoid
   third-party scripts. The encrypted vault lives in `localStorage`, so XSS could copy it for offline brute-forcing.
   Use a long passcode.
5. **Public RPC endpoints** can see your IP and the addresses you query. Use a private/self-hosted RPC for privacy.
6. **ENS lookups** go through the Ethereum RPC and are only as trustworthy as that RPC.
7. No transaction simulation, no hardware-wallet support, no token-approval management.
8. Passcodes are only length-checked (>= 6). Consider a strength meter.
9. Fiat rates come from CoinGecko's public API and are cached for 6 h; treat them as indicative.
10. Browser notifications only fire while the app is open (no push service / background polling).
