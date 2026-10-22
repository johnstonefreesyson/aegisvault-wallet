import { ethers } from 'ethers';
import { ERC20_ABI } from '../../config/networks';
import { SupportedChainId, TokenMetadata, WalletTransaction } from '../../types';
import { rpcService } from './rpcProvider';
import { secureStorage } from '../storage/secureStorage';
import { TransactionService } from './transactionService';
import { ApprovalService, rememberSpender } from './approvalService';
import { KeyOrSigner, asSigner } from './signerSource';

/** Same-chain swaps through the Velora (ParaSwap) aggregator API. No API key required. */
const API = 'https://api.paraswap.io';
export const NATIVE_PLACEHOLDER = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeEEEeE';
const SUPPORTED: SupportedChainId[] = [1, 56, 137, 42161, 10, 8453, 43114];

export const swapSupported = (c: SupportedChainId) => SUPPORTED.includes(c);

export interface SwapQuote {
  priceRoute: any;
  srcAmount: bigint;
  destAmount: bigint;
  minDestAmount: bigint;
  /** address that must be approved to pull the source token */
  spender: string;
  /** router contract the final transaction must target */
  router: string;
  gasCostUSD: number;
  /** estimated loss vs. market value, in percent (null when USD values are unknown) */
  impactPct: number | null;
}

const addr = (t: TokenMetadata) => (t.address === 'native' ? NATIVE_PLACEHOLDER : t.address);

async function getJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof body?.error === 'string' ? body.error : `Quote service error (${res.status})`;
    throw new Error(msg);
  }
  return body;
}

export class SwapService {
  static async getQuote(
    chainId: SupportedChainId, src: TokenMetadata, dest: TokenMetadata, amount: bigint, user: string, slippageBps: number
  ): Promise<SwapQuote> {
    if (!swapSupported(chainId)) throw new Error('Swaps are not available on this network.');
    const qs = new URLSearchParams({
      srcToken: addr(src), srcDecimals: String(src.decimals),
      destToken: addr(dest), destDecimals: String(dest.decimals),
      amount: amount.toString(), side: 'SELL', network: String(chainId),
      userAddress: user, version: '6.2',
    });
    const { priceRoute: pr } = await getJson(`${API}/prices?${qs.toString()}`);
    if (!pr?.destAmount) throw new Error('No route found for this pair and amount.');
    const destAmount = BigInt(pr.destAmount);
    const srcUSD = parseFloat(pr.srcUSD);
    const destUSD = parseFloat(pr.destUSD);
    return {
      priceRoute: pr,
      srcAmount: amount,
      destAmount,
      minDestAmount: (destAmount * BigInt(10000 - slippageBps)) / 10000n,
      spender: pr.tokenTransferProxy,
      router: pr.contractAddress,
      gasCostUSD: parseFloat(pr.gasCostUSD) || 0,
      impactPct: srcUSD > 0 && destUSD >= 0 && isFinite(destUSD) ? Math.max(0, (1 - destUSD / srcUSD) * 100) : null,
    };
  }

  /**
   * Approves (exact amount only, never unlimited) if needed, then builds, validates, signs and sends the swap.
   * `onStep` reports progress for the UI.
   */
  static async execute(
    chainId: SupportedChainId, privateKey: KeyOrSigner, src: TokenMetadata, dest: TokenMetadata,
    quote: SwapQuote, slippageBps: number, nativePriceUSD: number, onStep: (s: 'approving' | 'swapping') => void
  ): Promise<WalletTransaction> {
    const provider = rpcService.getProvider(chainId);
    const signer = asSigner(privateKey, provider);
    const user = await signer.getAddress();

    if (src.address !== 'native') {
      const allowance = await ApprovalService.readAllowance(chainId, src.address, user, quote.spender);
      if (allowance < quote.srcAmount) {
        onStep('approving');
        const token = new ethers.Contract(src.address, ERC20_ABI, signer);
        // Some tokens (USDT) require resetting to 0 before changing a non-zero allowance.
        if (allowance > 0n) await (await token.approve(quote.spender, 0n)).wait();
        const approveTx = await token.approve(quote.spender, quote.srcAmount);
        rememberSpender(user, chainId, src.address, quote.spender);
        await approveTx.wait();
      }
    }

    onStep('swapping');
    const built = await getJson(`${API}/transactions/${chainId}?ignoreChecks=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        srcToken: addr(src), srcDecimals: src.decimals,
        destToken: addr(dest), destDecimals: dest.decimals,
        srcAmount: quote.srcAmount.toString(),
        slippage: slippageBps,
        priceRoute: quote.priceRoute,
        userAddress: user,
      }),
    });

    // Never sign what the API hands back without checking it matches the quote.
    const expectedValue = src.address === 'native' ? quote.srcAmount : 0n;
    if (
      !ethers.isAddress(built.to) ||
      built.to.toLowerCase() !== quote.router.toLowerCase() ||
      BigInt(built.value || 0) !== expectedValue ||
      Number(built.chainId) !== chainId ||
      typeof built.data !== 'string' || !built.data.startsWith('0x')
    ) {
      throw new Error('The swap service returned an unexpected transaction. Nothing was sent.');
    }

    const feeData = await provider.getFeeData();
    const overrides: ethers.Overrides = {};
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      overrides.maxFeePerGas = feeData.maxFeePerGas;
      overrides.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    } else if (feeData.gasPrice) {
      overrides.gasPrice = feeData.gasPrice;
    }
    const sent = await signer.sendTransaction({ to: built.to, data: built.data, value: expectedValue, ...overrides });

    const record: WalletTransaction = {
      hash: sent.hash, chainId, from: user, to: built.to,
      amount: ethers.formatUnits(quote.srcAmount, src.decimals),
      symbol: `${src.symbol}→${dest.symbol}`,
      tokenAddress: src.address === 'native' ? undefined : src.address,
      timestamp: Date.now(), status: 'pending', type: 'contract_call',
      gasFeeEth: '0', gasFeeUSD: 0, nonce: sent.nonce,
      maxFeePerGas: (sent.maxFeePerGas ?? sent.gasPrice)?.toString(),
      maxPriorityFeePerGas: sent.maxPriorityFeePerGas?.toString(),
    };
    secureStorage.saveTransaction(record);
    TransactionService.pollTransactionReceipt(chainId, sent.hash, nativePriceUSD);
    return record;
  }
}
