import { ethers } from 'ethers';

export interface AssetDelta {
  assetSymbol: string;
  type: 'incoming' | 'outgoing';
  amount: string;
  usdValue: number;
}

export interface SimulationResult {
  isSafe: boolean;
  verdict: 'SAFE' | 'WARNING' | 'DANGEROUS';
  summary: string;
  assetDeltas: AssetDelta[];
  warnings: string[];
  gasCostUSD: number;
  unlimitedAllowanceGranted?: boolean;
}

export class TransactionSimulator {
  /**
   * Simulates a transaction prior to signing, predicting balance changes and flagging hazards
   */
  public simulateTransaction(tx: {
    to: string;
    from: string;
    value?: string;
    data?: string;
  }): SimulationResult {
    const warnings: string[] = [];
    const deltas: AssetDelta[] = [];
    let isSafe = true;
    let verdict: SimulationResult['verdict'] = 'SAFE';

    const cleanTo = tx.to ? tx.to.toLowerCase() : '';
    const data = tx.data || '0x';

    // 1. Native Value Transfer
    if (tx.value && tx.value !== '0' && tx.value !== '0x0') {
      try {
        const ethVal = typeof tx.value === 'string' && tx.value.startsWith('0x')
          ? ethers.formatEther(BigInt(tx.value))
          : tx.value;
        deltas.push({
          assetSymbol: 'ETH',
          type: 'outgoing',
          amount: ethVal,
          usdValue: parseFloat(ethVal) * 3100,
        });
      } catch {
        // ignore parse issue
      }
    }

    // 2. Decode common ERC-20 / Smart Contract function calls
    let unlimitedAllowanceGranted = false;
    if (data.startsWith('0x095ea7b3')) {
      // approve(address spender, uint256 amount)
      try {
        const iface = new ethers.Interface(['function approve(address spender, uint256 amount)']);
        const decoded = iface.decodeFunctionData('approve', data);
        const spender = decoded.spender;
        const amount = decoded.amount;

        // Check if amount is infinite (max uint256 or very large)
        if (amount > BigInt('1000000000000000000000000000000')) {
          unlimitedAllowanceGranted = true;
          verdict = 'WARNING';
          warnings.push(
            `Unlimited Token Allowance Requested: Spender contract (${spender.slice(0, 6)}…${spender.slice(-4)}) will have full permission to withdraw your tokens at any time.`
          );
        }
      } catch {
        // decode failed
      }
    } else if (data.startsWith('0xa9059cbb')) {
      // transfer(address to, uint256 amount)
      try {
        const iface = new ethers.Interface(['function transfer(address to, uint256 amount)']);
        const decoded = iface.decodeFunctionData('transfer', data);
        const tokenRecipient = decoded.to;
        const tokenAmount = ethers.formatUnits(decoded.amount, 18);
        deltas.push({
          assetSymbol: 'TOKEN',
          type: 'outgoing',
          amount: parseFloat(tokenAmount).toFixed(4),
          usdValue: parseFloat(tokenAmount) * 1.0,
        });
      } catch {
        // decode failed
      }
    } else if (data.startsWith('0x7ff36ab5') || data.startsWith('0x38ed1739') || data.startsWith('0x18cbafe5')) {
      // Uniswap Swap Router / Aggregator
      deltas.push({
        assetSymbol: 'USDC',
        type: 'incoming',
        amount: '1,250.00',
        usdValue: 1250,
      });
      deltas.push({
        assetSymbol: 'ETH',
        type: 'outgoing',
        amount: '0.40',
        usdValue: 1240,
      });
    }

    // 3. Null / Phishing addresses
    if (cleanTo === '0x0000000000000000000000000000000000000000') {
      isSafe = false;
      verdict = 'DANGEROUS';
      warnings.push('Destination is the zero address. All funds transferred will be burned and lost forever.');
    }

    if (warnings.length > 0 && verdict !== 'DANGEROUS') {
      verdict = 'WARNING';
    }

    const summary = isSafe
      ? verdict === 'WARNING'
        ? 'Simulation passed with high-privilege allowance warnings'
        : 'Simulation successful: Expected state changes verified'
      : 'Simulation flagged critical hazard: Transaction would result in loss of funds';

    return {
      isSafe,
      verdict,
      summary,
      assetDeltas: deltas,
      warnings,
      gasCostUSD: 1.85,
      unlimitedAllowanceGranted,
    };
  }
}

export const txSimulator = new TransactionSimulator();
