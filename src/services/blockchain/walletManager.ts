import { ethers } from 'ethers';
import { EncryptedWalletVault, WalletAccount } from '../../types';
import { encryptSecret, decryptSecret } from '../storage/cryptoUtils';
import { secureStorage } from '../storage/secureStorage';

export const STANDARD_DERIVATION_PATH = "m/44'/60'/0'/0/0";

export class WalletManager {
  /**
   * Generates a brand new random 12-word BIP-39 mnemonic phrase using ethers' BIP-39 implementation (browser-safe, no Buffer dependency)
   */
  static generateMnemonic(): string {
    return ethers.Mnemonic.entropyToPhrase(ethers.randomBytes(16)); // 128 bits = 12 words
  }

  /**
   * Validates whether a seed phrase is a valid BIP-39 phrase using ethers' BIP-39 implementation (browser-safe, no Buffer dependency)
   */
  static validateMnemonic(phrase: string): { isValid: boolean; error?: string } {
    const cleanPhrase = phrase.trim().toLowerCase().replace(/\s+/g, ' ');
    const words = cleanPhrase.split(' ');

    if (words.length !== 12 && words.length !== 24) {
      return { isValid: false, error: 'Recovery phrase must be exactly 12 or 24 words.' };
    }

    try {
      // Validate using ethers' BIP-39 implementation (browser-safe, no Buffer dependency) (official BIP39 dictionary and checksum algorithm)
      const isValid = ethers.Mnemonic.isValidMnemonic(cleanPhrase);
      if (!isValid) {
        return { isValid: false, error: 'Invalid recovery phrase words or checksum (verified by BIP-39 engine).' };
      }
      return { isValid: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid recovery phrase';
      return { isValid: false, error: msg };
    }
  }

  /**
   * Derives HD Wallet node and account from mnemonic
   */
  static deriveWalletFromMnemonic(phrase: string, derivationPath: string = STANDARD_DERIVATION_PATH): {
    address: string;
    privateKey: string;
    mnemonic: string;
  } {
    const cleanPhrase = phrase.trim().toLowerCase().replace(/\s+/g, ' ');
    const mnemonic = ethers.Mnemonic.fromPhrase(cleanPhrase);
    const hdNode = ethers.HDNodeWallet.fromMnemonic(mnemonic, derivationPath);

    return {
      address: ethers.getAddress(hdNode.address),
      privateKey: hdNode.privateKey,
      mnemonic: cleanPhrase,
    };
  }

  /**
   * Imports wallet from raw private key
   */
  static importFromPrivateKey(rawKey: string): { address: string; privateKey: string } {
    let cleanKey = rawKey.trim();
    if (!cleanKey.startsWith('0x')) {
      cleanKey = '0x' + cleanKey;
    }
    const wallet = new ethers.Wallet(cleanKey);
    return {
      address: ethers.getAddress(wallet.address),
      privateKey: wallet.privateKey,
    };
  }

  /**
   * Checks if an Ethereum address is valid (format & checksum)
   */
  static isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Saves newly created or imported wallet securely into encrypted vault
   */
  static async createAndSaveVault(
    name: string,
    privateKey: string,
    mnemonic: string | undefined,
    passcode: string
  ): Promise<EncryptedWalletVault> {
    const vault = await WalletManager.buildVault(name, privateKey, mnemonic, passcode);
    secureStorage.saveEncryptedVault(vault);
    secureStorage.setSessionUnlocked(true);
    return vault;
  }

  /**
   * Resolves a recovery phrase or raw private key into key material (validates, does not store anything).
   */
  static resolveSecret(phraseOrKey: string): { privateKey: string; mnemonic?: string } {
    const clean = phraseOrKey.trim();
    if (clean.includes(' ')) {
      const val = WalletManager.validateMnemonic(clean);
      if (!val.isValid) throw new Error(val.error || 'Invalid recovery phrase');
      const derived = WalletManager.deriveWalletFromMnemonic(clean);
      return { privateKey: derived.privateKey, mnemonic: derived.mnemonic };
    }
    let key = clean;
    if (!key.startsWith('0x')) key = '0x' + key;
    if (key.length !== 66) {
      throw new Error('Invalid private key. It must be 64 hex characters (32 bytes).');
    }
    try {
      return { privateKey: WalletManager.importFromPrivateKey(key).privateKey };
    } catch {
      throw new Error('Invalid private key.');
    }
  }

  /**
   * Encrypts key material into a vault object WITHOUT persisting it (used for additional wallets).
   */
  static async buildVault(
    name: string,
    privateKey: string,
    mnemonic: string | undefined,
    passcode: string
  ): Promise<EncryptedWalletVault> {
    const address = new ethers.Wallet(privateKey).address;
    
    // Encrypt private key
    const encKeyResult = await encryptSecret(privateKey, passcode);
    
    // Encrypt mnemonic if available
    let encMnemonicResult: { ciphertext: string; salt: string; iv: string } | undefined;
    if (mnemonic) {
      encMnemonicResult = await encryptSecret(mnemonic, passcode);
    }

    const vault: EncryptedWalletVault = {
      version: 1,
      id: crypto.randomUUID ? crypto.randomUUID() : `vault_${Date.now()}`,
      name,
      address,
      encryptedPrivateKey: encKeyResult.ciphertext,
      encryptedMnemonic: encMnemonicResult?.ciphertext,
      salt: encKeyResult.salt,
      iv: encKeyResult.iv,
      kdfIterations: encKeyResult.iterations,
      mnemonicSalt: encMnemonicResult?.salt,
      mnemonicIv: encMnemonicResult?.iv,
      hasMnemonic: !!mnemonic,
      createdAt: Date.now(),
    };

    return vault;
  }

  /**
   * Unlocks the vault using the passcode and returns the decrypted private key
   */
  static async unlockPrivateKey(vault: EncryptedWalletVault, passcode: string): Promise<string> {
    try {
      const privateKey = await decryptSecret(
        vault.encryptedPrivateKey,
        passcode,
        vault.salt,
        vault.iv,
        vault.kdfIterations
      );
      return privateKey;
    } catch {
      throw new Error('Incorrect passcode. Unable to decrypt wallet keys.');
    }
  }

  /**
   * Reveals mnemonic phrase if unlocked with passcode
   */
  static async unlockMnemonic(vault: EncryptedWalletVault, passcode: string): Promise<string> {
    if (!vault.encryptedMnemonic) {
      throw new Error('This wallet was imported via private key and does not have a recovery phrase.');
    }
    try {
      // The mnemonic is encrypted with its own salt/iv (older vaults reused the key's, which never decrypted).
      const mnemonic = await decryptSecret(
        vault.encryptedMnemonic,
        passcode,
        vault.mnemonicSalt ?? vault.salt,
        vault.mnemonicIv ?? vault.iv,
        vault.kdfIterations
      );
      return mnemonic;
    } catch {
      throw new Error('Incorrect passcode. Unable to reveal recovery phrase.');
    }
  }

  /** Derivation path for an HD account index. */
  static pathForIndex(index: number): string {
    return `m/44'/60'/0'/0/${index}`;
  }

  /** Whether more HD accounts can be derived (only wallets created from a recovery phrase). */
  static supportsMultipleAccounts(vault: EncryptedWalletVault): boolean {
    return !!vault.hasMnemonic && !!vault.encryptedMnemonic;
  }

  /**
   * Derives the address at an HD index. Requires the passcode (decrypts the recovery phrase in memory only).
   */
  static async deriveAddressAtIndex(
    vault: EncryptedWalletVault,
    index: number,
    passcode: string
  ): Promise<{ address: string; derivationPath: string }> {
    const phrase = await WalletManager.unlockMnemonic(vault, passcode);
    const path = WalletManager.pathForIndex(index);
    const derived = WalletManager.deriveWalletFromMnemonic(phrase, path);
    return { address: derived.address, derivationPath: path };
  }

  /**
   * Returns the private key that signs for a given account.
   */
  static async unlockAccountKey(
    vault: EncryptedWalletVault,
    account: { index: number } | null | undefined,
    passcode: string
  ): Promise<string> {
    if (!account || account.index === 0) {
      return WalletManager.unlockPrivateKey(vault, passcode);
    }
    const phrase = await WalletManager.unlockMnemonic(vault, passcode);
    return WalletManager.deriveWalletFromMnemonic(phrase, WalletManager.pathForIndex(account.index)).privateKey;
  }
}
