import { describe, it, expect, beforeEach } from 'vitest';
import { WalletManager } from '../src/services/blockchain/walletManager';

// Minimal in-memory Storage so the vault code can run in Node
class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

beforeEach(() => {
  (globalThis as any).localStorage = new MemoryStorage();
  (globalThis as any).sessionStorage = new MemoryStorage();
});

// Well-known BIP-39 test vector (Hardhat/Anvil default mnemonic)
const PHRASE = 'test test test test test test test test test test test junk';

describe('mnemonics', () => {
  it('generates valid 12-word phrases', () => {
    const p = WalletManager.generateMnemonic();
    expect(p.split(' ')).toHaveLength(12);
    expect(WalletManager.validateMnemonic(p).isValid).toBe(true);
  });

  it('rejects a bad checksum and wrong word counts', () => {
    expect(WalletManager.validateMnemonic('test test test test test test test test test test test test').isValid).toBe(false);
    expect(WalletManager.validateMnemonic('only three words').isValid).toBe(false);
  });
});

describe('HD derivation', () => {
  it('matches the known address for index 0', () => {
    const d = WalletManager.deriveWalletFromMnemonic(PHRASE);
    expect(d.address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  });

  it('matches the known address for index 1', () => {
    const d = WalletManager.deriveWalletFromMnemonic(PHRASE, WalletManager.pathForIndex(1));
    expect(d.address).toBe('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  });
});

describe('vault', () => {
  it('encrypts the key and the recovery phrase, and both can be unlocked', async () => {
    const d = WalletManager.deriveWalletFromMnemonic(PHRASE);
    const vault = await WalletManager.createAndSaveVault('Main', d.privateKey, PHRASE, 'passcode-1');
    expect(JSON.stringify(vault)).not.toContain(d.privateKey.slice(2, 20));
    expect(vault.kdfIterations).toBeGreaterThanOrEqual(600_000);
    expect(await WalletManager.unlockPrivateKey(vault, 'passcode-1')).toBe(d.privateKey);
    // regression: the recovery phrase used to be encrypted with a salt/iv that was never stored
    expect(await WalletManager.unlockMnemonic(vault, 'passcode-1')).toBe(PHRASE);
  });

  it('rejects the wrong passcode', async () => {
    const d = WalletManager.deriveWalletFromMnemonic(PHRASE);
    const vault = await WalletManager.createAndSaveVault('Main', d.privateKey, PHRASE, 'passcode-1');
    await expect(WalletManager.unlockPrivateKey(vault, 'nope-nope')).rejects.toThrow();
    await expect(WalletManager.unlockMnemonic(vault, 'nope-nope')).rejects.toThrow();
  });

  it('derives additional accounts and signs with the right key', async () => {
    const d = WalletManager.deriveWalletFromMnemonic(PHRASE);
    const vault = await WalletManager.createAndSaveVault('Main', d.privateKey, PHRASE, 'passcode-1');
    expect(WalletManager.supportsMultipleAccounts(vault)).toBe(true);
    const acc1 = await WalletManager.deriveAddressAtIndex(vault, 1, 'passcode-1');
    expect(acc1.address).toBe('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
    const key1 = await WalletManager.unlockAccountKey(vault, { index: 1 }, 'passcode-1');
    expect(WalletManager.importFromPrivateKey(key1).address).toBe(acc1.address);
  });

  it('private-key wallets cannot add accounts', async () => {
    const d = WalletManager.deriveWalletFromMnemonic(PHRASE);
    const vault = await WalletManager.createAndSaveVault('PK', d.privateKey, undefined, 'passcode-1');
    expect(WalletManager.supportsMultipleAccounts(vault)).toBe(false);
  });
});
