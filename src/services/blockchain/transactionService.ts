import { ethers } from 'ethers';
import { ERC20_ABI, SUPPORTED_NETWORKS } from '../../config/networks';
import { CustomFee, GasFeeEstimate, GasSpeed, SupportedChainId, WalletTransaction } from '../../types';
import { rpcService } from './rpcProvider';
import { secureStorage } from '../storage/secureStorage';
import { KeyOrSigner, asSigner } from './signerSource';

export const GAS_SPEED_MULTIPLIERS: Record<GasSpeed, { maxFee: number; priority: number; label: string; eta: string }> = {
  slow: { maxFee: 0.85, priority: 0.8, label: 'Slow', eta: '~2+ min' },
  normal: { maxFee: 1, priority: 1, label: 'Normal', eta: '~30 sec' },
  fast: { maxFee: 1.35, priority: 1.6, label: 'Fast', eta: '~15 sec' },
};

const scale = (v: bigint, m: number) => (v * BigInt(Math.round(m * 1000))) / 1000n;

export interface ResolvedFees {
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasPrice?: bigint;
}

export interface SimulationResult {
  ok: boolean;
  /** true when the RPC couldn't be reached, so we couldn't check (the send is not blocked). */
  skipped?: boolean;
  reason?: string;
}

/** Parses a custom fee; returns null if it is empty or invalid. */
export function parseCustomFee(c?: CustomFee | null): { maxFee: bigint; priority: bigint } | null {
  if (!c) return null;
  try {
    const maxFee = ethers.parseUnits(c.maxFeeGwei.trim() || '0', 'gwei');
    const priority = ethers.parseUnits(c.priorityGwei.trim() || '0', 'gwei');
    if (maxFee <= 0n || priority < 0n || priority > maxFee) return null;
    return { maxFee, priority };
  } catch {
    return null;
  }
}

export function resolveFees(feeData: ethers.FeeData, speed: GasSpeed, custom?: CustomFee | null): ResolvedFees {
  const c = parseCustomFee(custom);
  const is1559 = !!(feeData.maxFeePerGas && feeData.maxPriorityFeePerGas);
  if (c) {
    return is1559 ? { maxFeePerGas: c.maxFee, maxPriorityFeePerGas: c.priority } : { gasPrice: c.maxFee };
  }
  const mult = GAS_SPEED_MULTIPLIERS[speed];
  if (is1559) {
    return {
      maxFeePerGas: scale(feeData.maxFeePerGas!, mult.maxFee),
      maxPriorityFeePerGas: scale(feeData.maxPriorityFeePerGas!, mult.priority),
    };
  }
  return { gasPrice: scale(feeData.gasPrice || ethers.parseUnits('5', 'gwei'), mult.maxFee) };
}

function friendlyRevert(err: unknown): string {
  const e = err as { code?: string; shortMessage?: string; message?: string; reason?: string };
  const text = `${e?.shortMessage || ''} ${e?.reason || ''} ${e?.message || ''}`.toLowerCase();
  if (text.includes('insufficient funds') || e?.code === 'INSUFFICIENT_FUNDS')
    return 'Not enough native coin to cover the amount plus the network fee.';
  if (text.includes('exceeds balance') || text.includes('insufficient balance'))
    return 'The token balance is too low for this transfer.';
  if (text.includes('execution reverted') || e?.code === 'CALL_EXCEPTION' || e?.code === 'UNPREDICTABLE_GAS_LIMIT')
    return 'The network rejected this transfer (the token contract may restrict transfers or the balance is too low).';
  return 'The transaction would fail if sent.';
}

function isConnectivityError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR', 'BAD_DATA'].includes(e?.code || '') || /failed to fetch|network/i.test(e?.message || '');
}

export class TransactionService {
  /**
   * Dry-runs a transfer against the chain so we can refuse sends that would revert (and burn gas).
   */
  static async simulateTransfer(
    chainId: SupportedChainId,
    from: string,
    to: string,
    amount: string,
    tokenAddress: string,
    decimals: number
  ): Promise<SimulationResult> {
    const provider = rpcService.getProvider(chainId);
    try {
      if (tokenAddress === 'native') {
        await provider.estimateGas({ from, to, value: ethers.parseEther(amount || '0') });
      } else {
        const c = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        await c.transfer.estimateGas(to, ethers.parseUnits(amount || '0', decimals), { from });
      }
      return { ok: true };
    } catch (err) {
      if (isConnectivityError(err)) return { ok: true, skipped: true };
      return { ok: false, reason: friendlyRevert(err) };
    }
  }

  /**
   * Estimates network gas fees for either native currency or ERC-20 transfer
   */
  static async estimateGasFee(
    chainId: SupportedChainId,
    fromAddress: string,
    toAddress: string,
    amount: string,
    tokenAddress: string, // 'native' or contract address
    tokenDecimals: number,
    nativePriceUSD: number,
    speed: GasSpeed = 'normal',
    custom?: CustomFee | null
  ): Promise<GasFeeEstimate> {
    const provider = rpcService.getProvider(chainId);
    const feeData = await rpcService.getGasFeeData(chainId);

    let gasLimit = 21000n; // Standard native transfer gas limit

    if (tokenAddress !== 'native') {
      try {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const parsedAmount = ethers.parseUnits(amount || '0', tokenDecimals);
        const estimated = await contract.transfer.estimateGas(toAddress, parsedAmount, {
          from: fromAddress,
        });
        // Add 20% safety buffer for token transfers
        gasLimit = (estimated * 120n) / 100n;
      } catch {
        // Fallback standard ERC-20 transfer gas limit if estimation fails (e.g. 0 balance or contract state)
        gasLimit = 65000n;
      }
    }

    const fees = resolveFees(feeData, speed, custom);
    const perGas = fees.maxFeePerGas ?? fees.gasPrice ?? ethers.parseUnits('20', 'gwei');
    const totalGasWei = gasLimit * perGas;
    const feeInNative = ethers.formatEther(totalGasWei);
    const feeUSD = parseFloat(feeInNative) * (nativePriceUSD || 0);

    return {
      gasLimit: gasLimit.toString(),
      maxFeePerGas: fees.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas?.toString(),
      gasPrice: (fees.gasPrice ?? feeData.gasPrice)?.toString(),
      estimatedFeeNative: feeInNative,
      estimatedFeeUSD: feeUSD,
    };
  }

  /**
   * Calculates maximum spendable amount
   * For native token: balance - gas fee (with minimum safety buffer)
   * For ERC-20 token: full balance
   */
  static calculateMaxAmount(
    balance: string,
    isNative: boolean,
    estimatedFeeNative: string
  ): string {
    const balNum = parseFloat(balance || '0');
    if (balNum <= 0) return '0';

    if (!isNative) {
      return balance;
    }

    const feeNum = parseFloat(estimatedFeeNative || '0.001');
    const max = balNum - feeNum;
    return max > 0 ? max.toFixed(6) : '0';
  }

  /**
   * Executes local signing and broadcasts the transaction
   */
  static async sendTransaction(
    chainId: SupportedChainId,
    privateKey: KeyOrSigner,
    toAddress: string,
    amount: string,
    tokenAddress: string,
    tokenDecimals: number,
    tokenSymbol: string,
    nativePriceUSD: number,
    speed: GasSpeed = 'normal',
    custom?: CustomFee | null
  ): Promise<WalletTransaction> {
    const provider = rpcService.getProvider(chainId);
    const signer = asSigner(privateKey, provider);
    const fromAddress = await signer.getAddress();
    const feeData = await provider.getFeeData();
    const fees = resolveFees(feeData, speed, custom);

    const overrides: ethers.Overrides = {};
    if (fees.maxFeePerGas !== undefined) {
      overrides.maxFeePerGas = fees.maxFeePerGas;
      overrides.maxPriorityFeePerGas = fees.maxPriorityFeePerGas;
    } else if (fees.gasPrice !== undefined) {
      overrides.gasPrice = fees.gasPrice;
    }

    let txResponse: ethers.TransactionResponse;
    if (tokenAddress === 'native') {
      txResponse = await signer.sendTransaction({ to: toAddress, value: ethers.parseEther(amount), ...overrides });
    } else {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      txResponse = await contract.transfer(toAddress, ethers.parseUnits(amount, tokenDecimals), overrides);
    }

    const txRecord: WalletTransaction = {
      hash: txResponse.hash,
      chainId,
      from: fromAddress,
      to: toAddress,
      amount,
      symbol: tokenSymbol,
      tokenAddress: tokenAddress === 'native' ? undefined : tokenAddress,
      timestamp: Date.now(),
      status: 'pending',
      type: 'send',
      gasFeeEth: '0',
      gasFeeUSD: 0,
      nonce: txResponse.nonce,
      maxFeePerGas: (txResponse.maxFeePerGas ?? txResponse.gasPrice)?.toString(),
      maxPriorityFeePerGas: txResponse.maxPriorityFeePerGas?.toString(),
    };

    secureStorage.saveTransaction(txRecord);
    this.pollTransactionReceipt(chainId, txResponse.hash, nativePriceUSD);
    return txRecord;
  }

  /**
   * Replaces a pending transaction with the same nonce and higher fees.
   * "speedup" re-sends the same call; "cancel" sends 0 to yourself instead.
   */
  static async replacePending(
    chainId: SupportedChainId,
    privateKey: KeyOrSigner,
    hash: string,
    mode: 'speedup' | 'cancel',
    nativePriceUSD: number
  ): Promise<WalletTransaction> {
    const provider = rpcService.getProvider(chainId);
    const signer = asSigner(privateKey, provider);
    const signerAddress = await signer.getAddress();
    const orig = await provider.getTransaction(hash);
    if (!orig) throw new Error('This transaction is not visible to the network yet. Try again in a moment.');
    if (orig.blockNumber) throw new Error('This transaction has already been confirmed.');
    if (orig.from.toLowerCase() !== signerAddress.toLowerCase()) throw new Error('This transaction was sent from a different account.');

    const factor = mode === 'cancel' ? 130n : 115n; // nodes require at least +10%
    const bump = (v: bigint) => (v * factor) / 100n + 1n;
    const feeData = await provider.getFeeData();

    const overrides: ethers.Overrides = { nonce: orig.nonce };
    if (orig.maxFeePerGas != null && orig.maxPriorityFeePerGas != null) {
      let maxFee = bump(orig.maxFeePerGas);
      const priority = bump(orig.maxPriorityFeePerGas);
      if (feeData.maxFeePerGas && feeData.maxFeePerGas > maxFee) maxFee = feeData.maxFeePerGas;
      overrides.maxFeePerGas = maxFee > priority ? maxFee : priority;
      overrides.maxPriorityFeePerGas = priority;
    } else {
      const base = orig.gasPrice ?? feeData.gasPrice ?? ethers.parseUnits('5', 'gwei');
      overrides.gasPrice = bump(base);
    }

    const request: ethers.TransactionRequest =
      mode === 'cancel'
        ? { to: signerAddress, value: 0n, gasLimit: 21000n, ...overrides }
        : { to: orig.to ?? undefined, data: orig.data, value: orig.value, gasLimit: orig.gasLimit, ...overrides };

    const sent = await signer.sendTransaction(request);

    const old = secureStorage.getTransactions().find((t) => t.hash.toLowerCase() === hash.toLowerCase());
    const net = SUPPORTED_NETWORKS[chainId];
    const record: WalletTransaction = {
      ...(old || { chainId, from: signerAddress, to: signerAddress, amount: '0', symbol: net.nativeCurrency.symbol, type: 'send' as const }),
      hash: sent.hash,
      timestamp: Date.now(),
      status: 'pending',
      gasFeeEth: '0',
      gasFeeUSD: 0,
      gasUsed: undefined,
      blockNumber: undefined,
      errorMessage: undefined,
      replacedBy: undefined,
      nonce: sent.nonce,
      maxFeePerGas: (sent.maxFeePerGas ?? sent.gasPrice)?.toString(),
      maxPriorityFeePerGas: sent.maxPriorityFeePerGas?.toString(),
      ...(mode === 'cancel'
        ? { to: signerAddress, amount: '0', symbol: net.nativeCurrency.symbol, tokenAddress: undefined }
        : {}),
    };
    if (old) {
      secureStorage.saveTransaction({
        ...old,
        status: 'failed',
        replacedBy: sent.hash,
        errorMessage: mode === 'cancel' ? 'Cancelled (replaced by a 0-value transaction)' : 'Replaced by a faster transaction',
      });
    }
    secureStorage.saveTransaction(record);
    this.pollTransactionReceipt(chainId, sent.hash, nativePriceUSD);
    return record;
  }

  /**
   * Polls for receipt in background
   */
  static async pollTransactionReceipt(
    chainId: SupportedChainId,
    hash: string,
    nativePriceUSD: number
  ): Promise<void> {
    const provider = rpcService.getProvider(chainId);
    try {
      // Wait up to 60 seconds
      const receipt = await provider.waitForTransaction(hash, 1, 60000);
      if (receipt) {
        const isSuccess = receipt.status === 1;
        const gasUsed = receipt.gasUsed;
        const gasPrice = receipt.gasPrice || 0n;
        const feeEth = ethers.formatEther(gasUsed * gasPrice);
        const feeUSD = parseFloat(feeEth) * (nativePriceUSD || 0);

        secureStorage.updateTransactionStatus(
          hash,
          isSuccess ? 'confirmed' : 'reverted',
          receipt.blockNumber
        );

        // Update fee info in stored tx
        const txs = secureStorage.getTransactions();
        const target = txs.find((t) => t.hash.toLowerCase() === hash.toLowerCase());
        if (target) {
          target.gasUsed = gasUsed.toString();
          target.gasFeeEth = feeEth;
          target.gasFeeUSD = feeUSD;
          secureStorage.saveTransaction(target);
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('wallet:tx-updated', { detail: { hash, status: isSuccess ? 'confirmed' : 'reverted' } }));
        }
      }
    } catch {
      // Still pending or timed out polling
    }
  }
}
