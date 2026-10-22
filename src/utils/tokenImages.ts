import { ethers } from 'ethers';
import { SupportedChainId } from '../types';

const TRUST_WALLET_BASE = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains';

/**
 * Returns the official TrustWallet asset logo URL
 */
export function getTrustWalletAssetUrl(
  chainId: SupportedChainId,
  address: string,
  symbol?: string
): string {
  const sym = (symbol || '').toUpperCase();

  // Native coins
  if (!address || address === 'native' || address === '0x0') {
    switch (chainId) {
      case 1:
      case 11155111:
        return `${TRUST_WALLET_BASE}/ethereum/info/logo.png`;
      case 56:
        return `${TRUST_WALLET_BASE}/binance/info/logo.png`;
      case 137:
        return `${TRUST_WALLET_BASE}/polygon/info/logo.png`;
      case 42161:
        return `${TRUST_WALLET_BASE}/arbitrum/info/logo.png`;
      case 10:
        return `${TRUST_WALLET_BASE}/optimism/info/logo.png`;
      case 8453:
        return `${TRUST_WALLET_BASE}/base/info/logo.png`;
      case 43114:
        return `${TRUST_WALLET_BASE}/avalanchec/info/logo.png`;
      default:
        return `${TRUST_WALLET_BASE}/ethereum/info/logo.png`;
    }
  }

  // Contract tokens
  try {
    const checksummed = ethers.getAddress(address);
    switch (chainId) {
      case 1:
      case 11155111:
        return `${TRUST_WALLET_BASE}/ethereum/assets/${checksummed}/logo.png`;
      case 56:
        return `${TRUST_WALLET_BASE}/smartchain/assets/${checksummed}/logo.png`;
      case 137:
        return `${TRUST_WALLET_BASE}/polygon/assets/${checksummed}/logo.png`;
      case 42161:
        return `${TRUST_WALLET_BASE}/arbitrum/assets/${checksummed}/logo.png`;
      case 10:
        return `${TRUST_WALLET_BASE}/optimism/assets/${checksummed}/logo.png`;
      case 8453:
        return `${TRUST_WALLET_BASE}/base/assets/${checksummed}/logo.png`;
      case 43114:
        return `${TRUST_WALLET_BASE}/avalanchec/assets/${checksummed}/logo.png`;
      default:
        return `${TRUST_WALLET_BASE}/ethereum/assets/${checksummed}/logo.png`;
    }
  } catch {
    return `${TRUST_WALLET_BASE}/ethereum/info/logo.png`;
  }
}
