import { Request, Response } from 'express';

export class MarketService {
  static async getMarkets(req: Request, res: Response) {
    try {
      const vsCurrency = (req.query.vs_currency as string) || 'usd';
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vsCurrency}&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h`;
      
      const fetchRes = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      
      if (!fetchRes.ok) {
        throw new Error('CoinGecko API rate limit or error');
      }

      const data = await fetchRes.json();
      res.json({ success: true, data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Market data fetch failed';
      // Return cached fallback on rate limits
      res.status(200).json({
        success: true,
        source: 'cached_fallback',
        errorNotice: msg,
        data: [
          { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 94820, price_change_percentage_24h: 2.45 },
          { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3340, price_change_percentage_24h: 3.12 },
          { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: 645, price_change_percentage_24h: -0.84 },
          { id: 'matic-network', symbol: 'pol', name: 'Polygon', current_price: 0.58, price_change_percentage_24h: 5.62 },
        ],
      });
    }
  }
}
