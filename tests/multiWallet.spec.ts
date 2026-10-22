import { describe, it, expect } from 'vitest';
import { WalletManager } from '../src/services/blockchain/walletManager';

describe('multiple wallets', () => {
  it('each wallet vault reveals its own recovery phrase', async () => {
    const phraseA = WalletManager.generateMnemonic();
    const phraseB = WalletManager.generateMnemonic();
    const a = WalletManager.resolveSecret(phraseA);
    const b = WalletManager.resolveSecret(phraseB);
    const vaultA = await WalletManager.buildVault('A', a.privateKey, a.mnemonic, 'secret123');
    const vaultB = await WalletManager.buildVault('B', b.privateKey, b.mnemonic, 'secret123');

    expect(vaultA.address).not.toBe(vaultB.address);
    expect(await WalletManager.unlockMnemonic(vaultA, 'secret123')).toBe(phraseA);
    expect(await WalletManager.unlockMnemonic(vaultB, 'secret123')).toBe(phraseB);
  });

  it('private-key imports have no phrase and sign with their own key', async () => {
    const m = WalletManager.resolveSecret(WalletManager.generateMnemonic());
    const imported = WalletManager.resolveSecret(m.privateKey.replace(/^0x/, ''));
    const vault = await WalletManager.buildVault('PK', imported.privateKey, imported.mnemonic, 'secret123');
    expect(vault.hasMnemonic).toBe(false);
    await expect(WalletManager.unlockMnemonic(vault, 'secret123')).rejects.toThrow();
    expect(await WalletManager.unlockAccountKey(vault, { index: 0 }, 'secret123')).toBe(imported.privateKey);
  });

  it('rejects malformed secrets', () => {
    expect(() => WalletManager.resolveSecret('not a real phrase at all')).toThrow();
    expect(() => WalletManager.resolveSecret('0x1234')).toThrow();
  });
});
