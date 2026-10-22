import { ethers } from 'ethers';
import { SupportedChainId, TokenMetadata } from '../../types';

/**
 * Token auto-discovery and NFTs need an indexer (a plain RPC can't list "everything an address owns").
 * This uses Alchemy. Set VITE_ALCHEMY_KEY in .env and restrict the key to your domain in the Alchemy dashboard,
 * because anything in a browser bundle is public.
 */
const KEY = (import.meta.env.VITE_ALCHEMY_KEY as string | undefined)?.trim();

const SLUG: Partial<Record<SupportedChainId, string>> = {
  1: 'eth-mainnet',
  56: 'bnb-mainnet',
  137: 'polygon-mainnet',
  42161: 'arb-mainnet',
  10: 'opt-mainnet',
  8453: 'base-mainnet',
  43114: 'avax-mainnet',
  11155111: 'eth-sepolia',
};

export function indexerAvailable(chainId: SupportedChainId): boolean {
  return !!KEY && !!SLUG[chainId];
}
export function indexerConfigured(): boolean {
  return !!KEY;
}

const rpcUrl = (c: SupportedChainId) => `https://${SLUG[c]}.g.alchemy.com/v2/${KEY}`;
const nftUrl = (c: SupportedChainId) => `https://${SLUG[c]}.g.alchemy.com/nft/v3/${KEY}`;

async function rpc<T>(chainId: SupportedChainId, method: string, params: unknown[]): Promise<T> {
  const res = await fetch(rpcUrl(chainId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`Indexer error ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'Indexer error');
  return json.result as T;
}

/** Cheap heuristics for airdrop spam tokens (links, "claim", "visit", emoji hype, etc.). */
export function looksLikeSpam(name: string, symbol: string): boolean {
  const t = `${name} ${symbol}`.toLowerCase();
  return (
    /https?:|www\.|\.(com|net|org|io|xyz|cc|top|app|site|claim|link)\b/.test(t) ||
    /\b(claim|visit|airdrop|reward|voucher|bonus|gift|free|giveaway)\b/.test(t) ||
    name.length > 40 ||
    symbol.length > 14 ||
    /[^\x20-\x7E]/.test(symbol)
  );
}

export interface DiscoveredToken extends TokenMetadata {
  balance: string;
  likelySpam: boolean;
}

export async function discoverTokens(chainId: SupportedChainId, owner: string, known: string[]): Promise<DiscoveredToken[]> {
  if (!indexerAvailable(chainId)) return [];
  const knownSet = new Set(known.map((a) => a.toLowerCase()));
  const res = await rpc<{ tokenBalances: { contractAddress: string; tokenBalance: string | null }[] }>(
    chainId,
    'alchemy_getTokenBalances',
    [owner, 'erc20']
  );
  const nonZero = res.tokenBalances
    .filter((b) => b.tokenBalance && BigInt(b.tokenBalance) > 0n && !knownSet.has(b.contractAddress.toLowerCase()))
    .slice(0, 60);

  const out = await Promise.all(
    nonZero.map(async (b): Promise<DiscoveredToken | null> => {
      try {
        const md = await rpc<{ name: string | null; symbol: string | null; decimals: number | null }>(
          chainId, 'alchemy_getTokenMetadata', [b.contractAddress]
        );
        if (!md.symbol || md.decimals == null) return null;
        const name = md.name || md.symbol;
        return {
          address: ethers.getAddress(b.contractAddress),
          chainId,
          symbol: md.symbol,
          name,
          decimals: md.decimals,
          isCustom: true,
          balance: ethers.formatUnits(BigInt(b.tokenBalance as string), md.decimals),
          likelySpam: looksLikeSpam(name, md.symbol),
        };
      } catch {
        return null;
      }
    })
  );
  return out.filter((t): t is DiscoveredToken => !!t);
}

export interface NftItem {
  contract: string;
  tokenId: string;
  name: string;
  collection: string;
  image?: string;
  standard: string;
  balance: string;
}

const ipfs = (u?: string | null) => (u ? u.replace(/^ipfs:\/\/(ipfs\/)?/, 'https://ipfs.io/ipfs/') : undefined);

export async function fetchNfts(chainId: SupportedChainId, owner: string, pageKey?: string): Promise<{ nfts: NftItem[]; pageKey?: string }> {
  if (!indexerAvailable(chainId)) return { nfts: [] };
  const qs = new URLSearchParams({ owner, withMetadata: 'true', pageSize: '40' });
  qs.append('excludeFilters[]', 'SPAM');
  if (pageKey) qs.set('pageKey', pageKey);
  const res = await fetch(`${nftUrl(chainId)}/getNFTsForOwner?${qs.toString()}`);
  if (!res.ok) throw new Error(`Indexer error ${res.status}`);
  const json = await res.json();
  const nfts: NftItem[] = (json.ownedNfts || []).map((n: any) => ({
    contract: n.contract?.address,
    tokenId: String(n.tokenId),
    name: n.name || n.contract?.name || `#${n.tokenId}`,
    collection: n.collection?.name || n.contract?.name || '',
    image: ipfs(n.image?.cachedUrl || n.image?.thumbnailUrl || n.image?.originalUrl),
    standard: n.tokenType || '',
    balance: String(n.balance ?? '1'),
  }));
  return { nfts, pageKey: json.pageKey || undefined };
}
