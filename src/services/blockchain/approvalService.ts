import { ethers } from 'ethers';
import { ERC20_ABI } from '../../config/networks';
import { SupportedChainId } from '../../types';
import { rpcService } from './rpcProvider';
import { TokenService } from './tokenService';
import { KeyOrSigner, asSigner } from './signerSource';

export const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const APPROVAL_TOPIC = ethers.id('Approval(address,address,uint256)');
const UNLIMITED_THRESHOLD = 2n ** 255n;
const SPENDERS_KEY = 'aegisvault_known_spenders';

export interface ApprovalEntry {
  chainId: SupportedChainId;
  token: string;
  symbol: string;
  decimals: number;
  spender: string;
  allowance: bigint;
  unlimited: boolean;
  formatted: string;
}

export interface ScanResult {
  entries: ApprovalEntry[];
  /** How many blocks of history were scanned (0 = the RPC refused log queries). */
  scannedBlocks: number;
}

type SpenderMap = Record<string, { token: string; spender: string }[]>;

function loadSpenders(): SpenderMap {
  try {
    return JSON.parse(localStorage.getItem(SPENDERS_KEY) || '{}');
  } catch {
    return {};
  }
}

/** Remember a (token, spender) pair so it is always re-checked, even if it falls outside the log scan window. */
export function rememberSpender(owner: string, chainId: number, token: string, spender: string): void {
  try {
    const all = loadSpenders();
    const key = `${owner.toLowerCase()}:${chainId}`;
    const list = all[key] || [];
    if (!list.some((p) => p.token.toLowerCase() === token.toLowerCase() && p.spender.toLowerCase() === spender.toLowerCase())) {
      list.push({ token, spender });
      all[key] = list.slice(-200);
      localStorage.setItem(SPENDERS_KEY, JSON.stringify(all));
    }
  } catch {
    /* best-effort */
  }
}

/** ERC-20 approve(spender, amount) calldata detector, used to remember approvals this wallet signs. */
export function parseApproveCall(data: string | undefined): { spender: string } | null {
  if (!data || !data.toLowerCase().startsWith('0x095ea7b3') || data.length < 10 + 64) return null;
  try {
    return { spender: ethers.getAddress('0x' + data.slice(10 + 24, 10 + 64)) };
  } catch {
    return null;
  }
}

export class ApprovalService {
  static async readAllowance(chainId: SupportedChainId, token: string, owner: string, spender: string): Promise<bigint> {
    const c = new ethers.Contract(token, ERC20_ABI, rpcService.getProvider(chainId));
    return (await c.allowance(owner, spender)) as bigint;
  }

  /**
   * Finds ERC-20 allowances that are still active. Sources: (1) Approval logs in a recent window,
   * (2) approvals this wallet signed, (3) the extra tokens/spenders in `extra`.
   * Public RPCs limit log ranges, so older approvals may be missed; users can check a specific spender manually.
   */
  static async scan(
    chainId: SupportedChainId,
    owner: string,
    knownTokens: { address: string; symbol: string; decimals: number }[]
  ): Promise<ScanResult> {
    const provider = rpcService.getProvider(chainId);
    const pairs = new Map<string, { token: string; spender: string }>();
    const add = (token: string, spender: string) => {
      if (!ethers.isAddress(token) || !ethers.isAddress(spender)) return;
      pairs.set(`${token.toLowerCase()}:${spender.toLowerCase()}`, { token: ethers.getAddress(token), spender: ethers.getAddress(spender) });
    };

    // Permit2 is the most common spender; check it for every token we know.
    knownTokens.filter((t) => t.address !== 'native').forEach((t) => add(t.address, PERMIT2));
    (loadSpenders()[`${owner.toLowerCase()}:${chainId}`] || []).forEach((p) => add(p.token, p.spender));

    let scannedBlocks = 0;
    try {
      const latest = await provider.getBlockNumber();
      const ownerTopic = ethers.zeroPadValue(owner, 32);
      for (const range of [100_000, 25_000, 5_000]) {
        try {
          const logs = await provider.getLogs({
            topics: [APPROVAL_TOPIC, ownerTopic],
            fromBlock: Math.max(0, latest - range),
            toBlock: latest,
          });
          logs.forEach((l) => {
            if (l.topics.length === 3) add(l.address, ethers.getAddress('0x' + l.topics[2].slice(26))); // ERC-20 only (ERC-721 has 4 topics)
          });
          scannedBlocks = range;
          break;
        } catch {
          /* try a smaller window */
        }
      }
    } catch {
      /* no log access at all */
    }

    const meta = new Map(knownTokens.map((t) => [t.address.toLowerCase(), t]));
    const entries: ApprovalEntry[] = [];
    await Promise.all(
      Array.from(pairs.values()).slice(0, 150).map(async ({ token, spender }) => {
        try {
          const allowance = await ApprovalService.readAllowance(chainId, token, owner, spender);
          if (allowance === 0n) return;
          let m = meta.get(token.toLowerCase());
          if (!m) {
            const md = await TokenService.getTokenMetadata(chainId, token);
            m = { address: token, symbol: md.symbol, decimals: md.decimals };
          }
          const unlimited = allowance >= UNLIMITED_THRESHOLD;
          entries.push({
            chainId, token, symbol: m.symbol, decimals: m.decimals, spender, allowance, unlimited,
            formatted: unlimited ? 'Unlimited' : ethers.formatUnits(allowance, m.decimals),
          });
        } catch {
          /* skip tokens that don't behave like ERC-20 */
        }
      })
    );
    entries.sort((a, b) => Number(b.unlimited) - Number(a.unlimited));
    return { entries, scannedBlocks };
  }

  /** Sets the allowance to zero. */
  static async revoke(chainId: SupportedChainId, privateKey: KeyOrSigner, token: string, spender: string): Promise<string> {
    const signer = asSigner(privateKey, rpcService.getProvider(chainId));
    const c = new ethers.Contract(token, ERC20_ABI, signer);
    const tx = await c.approve(spender, 0n);
    return tx.hash as string;
  }
}
