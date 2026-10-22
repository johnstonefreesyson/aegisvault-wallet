import { MarketToken } from '../../types';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Fallback baseline prices in case CoinGecko is rate-limited or offline
const FALLBACK_MARKET_DATA: MarketToken[] = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    current_price: 94820.0,
    market_cap: 1860000000000,
    market_cap_rank: 1,
    total_volume: 38500000000,
    price_change_percentage_24h: 2.45,
    sparkline_in_7d: {
      price: [91200, 92100, 93400, 92800, 94200, 93900, 94820],
    },
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    current_price: 3340.5,
    market_cap: 402000000000,
    market_cap_rank: 2,
    total_volume: 22100000000,
    price_change_percentage_24h: 3.12,
    sparkline_in_7d: {
      price: [3150, 3200, 3280, 3240, 3310, 3300, 3340.5],
    },
  },
  {
    id: 'binancecoin',
    symbol: 'bnb',
    name: 'BNB',
    image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
    current_price: 645.2,
    market_cap: 94000000000,
    market_cap_rank: 4,
    total_volume: 1800000000,
    price_change_percentage_24h: -0.84,
    sparkline_in_7d: {
      price: [650, 655, 648, 642, 646, 643, 645.2],
    },
  },
  {
    id: 'matic-network',
    symbol: 'pol',
    name: 'Polygon',
    image: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png',
    current_price: 0.58,
    market_cap: 4700000000,
    market_cap_rank: 28,
    total_volume: 310000000,
    price_change_percentage_24h: 5.62,
    sparkline_in_7d: {
      price: [0.52, 0.53, 0.55, 0.54, 0.56, 0.57, 0.58],
    },
  },
  {
    id: 'tether',
    symbol: 'usdt',
    name: 'Tether USD',
    image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
    current_price: 1.0,
    market_cap: 118000000000,
    market_cap_rank: 3,
    total_volume: 52000000000,
    price_change_percentage_24h: 0.01,
    sparkline_in_7d: {
      price: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    },
  },
  {
    id: 'usd-coin',
    symbol: 'usdc',
    name: 'USDC',
    image: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
    current_price: 1.0,
    market_cap: 34000000000,
    market_cap_rank: 6,
    total_volume: 6800000000,
    price_change_percentage_24h: -0.02,
    sparkline_in_7d: {
      price: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    },
  },
  {
    id: 'wrapped-bitcoin',
    symbol: 'wbtc',
    name: 'Wrapped Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png',
    current_price: 94750.0,
    market_cap: 14500000000,
    market_cap_rank: 15,
    total_volume: 420000000,
    price_change_percentage_24h: 2.38,
    sparkline_in_7d: {
      price: [91100, 92000, 93300, 92700, 94100, 93800, 94750],
    },
  },
  {
    id: 'chainlink',
    symbol: 'link',
    name: 'Chainlink',
    image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
    current_price: 18.4,
    market_cap: 11200000000,
    market_cap_rank: 18,
    total_volume: 890000000,
    price_change_percentage_24h: 4.15,
    sparkline_in_7d: {
      price: [16.8, 17.2, 17.5, 17.1, 18.0, 18.1, 18.4],
    },
  },
  {
    id: 'dai',
    symbol: 'dai',
    name: 'Dai',
    image: 'https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png',
    current_price: 1.0,
    market_cap: 5100000000,
    market_cap_rank: 25,
    total_volume: 240000000,
    price_change_percentage_24h: 0.0,
    sparkline_in_7d: {
      price: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    },
  },
  {
    id: 'pancakeswap-token',
    symbol: 'cake',
    name: 'PancakeSwap',
    image: 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo_animated.png',
    current_price: 2.35,
    market_cap: 620000000,
    market_cap_rank: 120,
    total_volume: 75000000,
    price_change_percentage_24h: 1.85,
    sparkline_in_7d: {
      price: [2.15, 2.2, 2.25, 2.22, 2.3, 2.28, 2.35],
    },
  },
  {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    current_price: 182.5,
    market_cap: 86000000000,
    market_cap_rank: 5,
    total_volume: 4500000000,
    price_change_percentage_24h: 4.8,
    sparkline_in_7d: {
      price: [168, 172, 176, 174, 180, 179, 182.5],
    },
  },
  {
    id: 'avalanche-2',
    symbol: 'avax',
    name: 'Avalanche',
    image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
    current_price: 32.1,
    market_cap: 13000000000,
    market_cap_rank: 16,
    total_volume: 510000000,
    price_change_percentage_24h: -1.2,
    sparkline_in_7d: {
      price: [33.5, 33.0, 32.8, 32.4, 32.6, 32.2, 32.1],
    },
  },
];

class MarketDataService {
  private cache: MarketToken[] = FALLBACK_MARKET_DATA;
  private lastFetchTime = 0;
  private isFetching = false;
  /** Prices for assets outside the top-20 list (ARB, OP, WAVAX, ...), keyed by CoinGecko id. */
  private extra: Record<string, { priceUSD: number; change24h: number }> = {};

  async getMarketOverview(forceRefresh = false): Promise<MarketToken[]> {
    const now = Date.now();
    // Cache for 60 seconds unless forced
    if (!forceRefresh && this.cache.length > 0 && now - this.lastFetchTime < 60000) {
      return this.cache;
    }

    if (this.isFetching) {
      return this.cache;
    }

    this.isFetching = true;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: MarketToken[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.cache = data;
          this.lastFetchTime = now;
        }
      }
    } catch {
      // Keep existing or fallback cache
    } finally {
      this.isFetching = false;
    }

    return this.cache;
  }

  /** Fetches prices for CoinGecko ids that aren't in the market overview. Failures are ignored. */
  async fetchExtraPrices(ids: string[]): Promise<void> {
    const wanted = Array.from(new Set(ids.map((i) => i.toLowerCase()))).filter(
      (id) => !this.cache.some((m) => m.id.toLowerCase() === id)
    );
    if (wanted.length === 0) return;
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(
        `${COINGECKO_BASE}/simple/price?ids=${encodeURIComponent(wanted.join(','))}&vs_currencies=usd&include_24hr_change=true`,
        { signal: controller.signal, headers: { Accept: 'application/json' } }
      );
      clearTimeout(t);
      if (!res.ok) return;
      const data = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
      for (const [id, v] of Object.entries(data)) {
        if (typeof v.usd === 'number') this.extra[id.toLowerCase()] = { priceUSD: v.usd, change24h: v.usd_24h_change ?? 0 };
      }
    } catch {
      /* keep whatever we have */
    }
  }

  getPriceForToken(symbolOrId: string): { priceUSD: number; change24h: number } {
    const normalized = symbolOrId.toLowerCase();
    if (this.extra[normalized]) return this.extra[normalized];
    const found = this.cache.find(
      (m) => m.id.toLowerCase() === normalized || m.symbol.toLowerCase() === normalized
    );

    if (found) {
      return {
        priceUSD: found.current_price,
        change24h: found.price_change_percentage_24h,
      };
    }

    // Default stablecoins
    if (['usdt', 'usdc', 'dai'].includes(normalized)) {
      return { priceUSD: 1.0, change24h: 0.0 };
    }

    return { priceUSD: 0, change24h: 0 };
  }
}

export const marketService = new MarketDataService();
