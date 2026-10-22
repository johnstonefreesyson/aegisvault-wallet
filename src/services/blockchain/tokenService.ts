import { ethers } from 'ethers';
import { ERC20_ABI } from '../../config/networks';
import { rpcService } from './rpcProvider';
import { SupportedChainId, TokenMetadata } from '../../types';

export class TokenService {
  /**
   * Fetches metadata for an ERC-20 token contract directly from the blockchain
   */
  static async getTokenMetadata(
    chainId: SupportedChainId,
    tokenAddress: string
  ): Promise<{ name: string; symbol: string; decimals: number }> {
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error('Invalid token contract address.');
    }

    const provider = rpcService.getProvider(chainId);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    try {
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
      };
    } catch (err: unknown) {
      throw new Error(
        'Unable to query contract. Please ensure this is a valid ERC-20 token contract on this network.'
      );
    }
  }

  /**
   * Fetches the balance of an ERC-20 token for a user address
   */
  static async getTokenBalance(
    chainId: SupportedChainId,
    tokenAddress: string,
    userAddress: string,
    decimals: number
  ): Promise<{ formatted: string; raw: string }> {
    const provider = rpcService.getProvider(chainId);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    try {
      const rawBalance = await contract.balanceOf(userAddress);
      const formatted = ethers.formatUnits(rawBalance, decimals);
      return {
        formatted,
        raw: rawBalance.toString(),
      };
    } catch (err) {
      // Let the caller decide: returning 0 here would hide RPC failures as empty balances.
      throw err;
    }
  }

  /**
   * Formats a token amount with human-readable precision
   */
  static formatBalance(balanceStr: string, maxDecimals: number = 4): string {
    const num = parseFloat(balanceStr);
    if (isNaN(num) || num === 0) return '0.00';
    if (num < 0.0001) return '<0.0001';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDecimals,
    });
  }
}
