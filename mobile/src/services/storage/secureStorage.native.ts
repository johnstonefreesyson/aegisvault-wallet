import * as Keychain from 'react-native-keychain';
import EncryptedStorage from 'react-native-encrypted-storage';

export class NativeSecureStorage {
  /**
   * Stores encrypted mnemonic and private key into hardware-backed Keystore / Secure Enclave
   */
  static async saveWalletCredentials(walletId: string, secretPayload: string): Promise<boolean> {
    try {
      await Keychain.setGenericPassword(walletId, secretPayload, {
        service: `aegisvault.${walletId}`,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
      });
      return true;
    } catch {
      // Fallback to AES EncryptedStorage
      await EncryptedStorage.setItem(`vault_${walletId}`, secretPayload);
      return true;
    }
  }

  /**
   * Retrieves credentials from hardware Keystore / Secure Enclave
   */
  static async getWalletCredentials(walletId: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: `aegisvault.${walletId}`,
      });
      if (credentials) {
        return credentials.password;
      }
      return await EncryptedStorage.getItem(`vault_${walletId}`);
    } catch {
      return null;
    }
  }

  /**
   * Completely purges wallet secrets from device
   */
  static async removeWalletCredentials(walletId: string): Promise<void> {
    await Keychain.resetGenericPassword({ service: `aegisvault.${walletId}` });
    await EncryptedStorage.removeItem(`vault_${walletId}`);
  }
}
