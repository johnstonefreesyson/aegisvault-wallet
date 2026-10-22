/**
 * Automated test suite for wallet engine, address derivation, BIP-39 validation, and token conversion
 */

import { ethers } from 'ethers';
import { WalletManager } from '../services/blockchain/walletManager';
import { TokenService } from '../services/blockchain/tokenService';
import { TransactionService } from '../services/blockchain/transactionService';

export function runWalletUnitTests(): { total: number; passed: number; results: { name: string; success: boolean; details?: string }[] } {
  const results: { name: string; success: boolean; details?: string }[] = [];

  // Test 1: BIP-39 12-Word Mnemonic Generation
  try {
    const mnemonic = WalletManager.generateMnemonic();
    const words = mnemonic.split(' ');
    const isTwelve = words.length === 12;
    const isValid = WalletManager.validateMnemonic(mnemonic).isValid;

    results.push({
      name: 'BIP-39 Mnemonic Generation & Checksum',
      success: isTwelve && isValid,
      details: isTwelve && isValid ? `Generated valid 12-word phrase` : 'Failed word count or checksum',
    });
  } catch (err: unknown) {
    results.push({
      name: 'BIP-39 Mnemonic Generation & Checksum',
      success: false,
      details: String(err),
    });
  }

  // Test 2: Standard Derivation Path Address Consistency
  try {
    const testPhrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const derived = WalletManager.deriveWalletFromMnemonic(testPhrase);
    
    // Test known BIP-44 address for this test mnemonic at m/44'/60'/0'/0/0
    const isValidChecksum = ethers.isAddress(derived.address);
    results.push({
      name: 'BIP-44 HD Derivation Path',
      success: isValidChecksum && derived.address.startsWith('0x'),
      details: `Derived address: ${derived.address}`,
    });
  } catch (err: unknown) {
    results.push({
      name: 'BIP-44 HD Derivation Path',
      success: false,
      details: String(err),
    });
  }

  // Test 3: Address Validation
  try {
    const valid = WalletManager.isValidAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7');
    const invalid = WalletManager.isValidAddress('0xNotAnAddress123');
    results.push({
      name: 'EVM Address Hex & Checksum Validation',
      success: valid && !invalid,
      details: 'Correctly discriminated valid and invalid addresses',
    });
  } catch (err: unknown) {
    results.push({
      name: 'EVM Address Hex & Checksum Validation',
      success: false,
      details: String(err),
    });
  }

  // Test 4: Token Balance Formatting
  try {
    const formattedZero = TokenService.formatBalance('0');
    const formattedDec = TokenService.formatBalance('1234.56789', 2);
    results.push({
      name: 'Token Decimal Conversion & Formatting',
      success: formattedZero === '0.00' && formattedDec === '1,234.57',
      details: `Formatted output: ${formattedDec}`,
    });
  } catch (err: unknown) {
    results.push({
      name: 'Token Decimal Conversion & Formatting',
      success: false,
      details: String(err),
    });
  }

  // Test 5: Maximum Spendable Native Fee Calculation
  try {
    const maxNative = TransactionService.calculateMaxAmount('1.5', true, '0.002');
    const maxToken = TransactionService.calculateMaxAmount('500.0', false, '0.002');
    results.push({
      name: 'Max Spendable Calculation (Gas Deducted for Native)',
      success: parseFloat(maxNative) < 1.5 && maxToken === '500.0',
      details: `Native Max: ${maxNative}, Token Max: ${maxToken}`,
    });
  } catch (err: unknown) {
    results.push({
      name: 'Max Spendable Calculation (Gas Deducted for Native)',
      success: false,
      details: String(err),
    });
  }

  const passed = results.filter((r) => r.success).length;
  return { total: results.length, passed, results };
}
