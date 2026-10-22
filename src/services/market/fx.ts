import { FiatCurrency } from '../../types';
import { secureStorage } from '../storage/secureStorage';

export const FIAT_OPTIONS: { code: FiatCurrency; label: string }[] = [
  { code: 'USD', label: 'USD ($)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'JPY', label: 'JPY (¥)' },
  { code: 'NGN', label: 'NGN (₦)' },
  { code: 'CAD', label: 'CAD (C$)' },
  { code: 'AUD', label: 'AUD (A$)' },
  { code: 'INR', label: 'INR (₹)' },
  { code: 'ZAR', label: 'ZAR (R)' },
];

// Approximate fallbacks, used only until live rates load (units of currency per 1 USD).
export const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.78, JPY: 150, NGN: 1500, CAD: 1.37, AUD: 1.52, INR: 84, ZAR: 18,
};

const TTL_MS = 6 * 60 * 60 * 1000;

/** Convert CoinGecko's BTC-based exchange_rates payload into per-USD rates. */
export function ratesFromBtcTable(table: Record<string, { value: number }>): Record<string, number> {
  const usd = table?.usd?.value;
  if (!usd) return {};
  const out: Record<string, number> = {};
  for (const { code } of FIAT_OPTIONS) {
    const v = table[code.toLowerCase()]?.value;
    if (v) out[code] = v / usd;
  }
  return out;
}

export function formatFiat(usdValue: number, currency: FiatCurrency, rates: Record<string, number>, opts?: { compact?: boolean }): string {
  const rate = rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
  const value = (usdValue || 0) * rate;
  const small = Math.abs(value) > 0 && Math.abs(value) < 1;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: currency === 'NGN' || currency === 'ZAR' ? 'narrowSymbol' : 'symbol',
    minimumFractionDigits: currency === 'JPY' || currency === 'NGN' ? 0 : 2,
    maximumFractionDigits: small ? 4 : currency === 'JPY' || currency === 'NGN' ? 0 : 2,
    ...(opts?.compact ? { notation: 'compact' as const } : {}),
  }).format(value);
}

export async function loadRates(): Promise<Record<string, number>> {
  const cached = secureStorage.getFxCache();
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return { ...FALLBACK_RATES, ...cached.rates };
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/exchange_rates');
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    const rates = ratesFromBtcTable(json.rates);
    if (Object.keys(rates).length) {
      secureStorage.saveFxCache(rates);
      return { ...FALLBACK_RATES, ...rates };
    }
  } catch {
    /* fall through to cache/fallback */
  }
  return { ...FALLBACK_RATES, ...(cached?.rates || {}) };
}
