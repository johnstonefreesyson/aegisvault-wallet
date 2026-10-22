import { describe, it, expect } from 'vitest';
import { checkRecipient, isLookalike } from '../src/utils/addressSafety';
import { formatFiat, ratesFromBtcTable, FALLBACK_RATES } from '../src/services/market/fx';
import type { WalletTransaction } from '../src/types';

const ME = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const BOB = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const TOKEN = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

const base = { ownAddresses: [ME], tokenContracts: [TOKEN], contacts: [], transactions: [] as WalletTransaction[] };
const codes = (to: string, extra = {}) => checkRecipient({ ...base, toAddress: to, ...extra }).map((f) => f.code);

describe('recipient safety checks', () => {
  it('blocks invalid addresses, own addresses and the zero address', () => {
    expect(codes('0x123')).toEqual(['invalid']);
    expect(codes(ME)).toContain('self');
    expect(codes('0x0000000000000000000000000000000000000000')).toContain('zero_address');
  });

  it('warns about token contracts and smart contracts', () => {
    expect(codes(TOKEN)).toContain('token_contract');
    expect(codes(BOB, { recipientIsContract: true })).toContain('token_contract');
  });

  it('warns on a first-time recipient but not a saved contact', () => {
    expect(codes(BOB)).toContain('new_recipient');
    const contacts = [{ id: '1', name: 'Bob', address: BOB, createdAt: 0 }];
    const c = codes(BOB, { contacts });
    expect(c).not.toContain('new_recipient');
    expect(c).toContain('known_contact');
  });

  it('flags look-alike (address poisoning) addresses', () => {
    const twin = BOB.slice(0, 8) + 'a'.repeat(30) + BOB.slice(-4);
    expect(isLookalike(BOB, twin)).toBe(true);
    expect(isLookalike(BOB, BOB)).toBe(false);
    const contacts = [{ id: '1', name: 'Bob', address: BOB, createdAt: 0 }];
    expect(codes(ethersAddr(twin), { contacts })).toContain('lookalike');
  });
});

import { ethers } from 'ethers';
function ethersAddr(a: string) {
  return ethers.getAddress(a.toLowerCase());
}

describe('currency conversion', () => {
  it('converts CoinGecko BTC-based rates into per-USD rates', () => {
    const rates = ratesFromBtcTable({ usd: { value: 100000 }, eur: { value: 92000 }, ngn: { value: 150000000 } });
    expect(rates.EUR).toBeCloseTo(0.92);
    expect(rates.NGN).toBeCloseTo(1500);
  });

  it('formats using the chosen currency and rate', () => {
    expect(formatFiat(10, 'USD', FALLBACK_RATES)).toBe('$10.00');
    expect(formatFiat(10, 'EUR', { ...FALLBACK_RATES, EUR: 0.9 })).toBe('€9.00');
    expect(formatFiat(0, 'USD', FALLBACK_RATES)).toBe('$0.00');
    expect(formatFiat(2, 'NGN', { ...FALLBACK_RATES, NGN: 1500 })).toBe('₦3,000');
  });
});
