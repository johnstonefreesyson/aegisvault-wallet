import { ethers } from 'ethers';
import { Contact, WalletTransaction } from '../types';

export type SafetyLevel = 'block' | 'warn' | 'info';
export interface SafetyFinding {
  level: SafetyLevel;
  code: 'invalid' | 'self' | 'token_contract' | 'zero_address' | 'new_recipient' | 'lookalike' | 'known_contact';
  message: string;
}

export interface SafetyContext {
  toAddress: string;
  ownAddresses: string[];
  tokenContracts: string[];
  contacts: Contact[];
  transactions: WalletTransaction[];
  /** true when the recipient is a smart contract (looked up on-chain); undefined = unknown. */
  recipientIsContract?: boolean;
}

const lc = (s: string) => s.toLowerCase();

/** Same first 4 and last 4 characters as a known address, but not identical: classic address-poisoning pattern. */
export function isLookalike(a: string, b: string): boolean {
  if (lc(a) === lc(b)) return false;
  const x = lc(a).replace(/^0x/, '');
  const y = lc(b).replace(/^0x/, '');
  return x.length === 40 && y.length === 40 && x.slice(0, 4) === y.slice(0, 4) && x.slice(-4) === y.slice(-4);
}

export function checkRecipient(ctx: SafetyContext): SafetyFinding[] {
  const out: SafetyFinding[] = [];
  const to = ctx.toAddress.trim();

  if (!ethers.isAddress(to)) {
    return [{ level: 'block', code: 'invalid', message: 'This is not a valid EVM address.' }];
  }
  if (to === ethers.ZeroAddress) {
    out.push({ level: 'block', code: 'zero_address', message: 'Sending to the zero address would permanently burn your funds.' });
  }
  if (ctx.ownAddresses.some((a) => lc(a) === lc(to))) {
    out.push({ level: 'block', code: 'self', message: 'This is one of your own addresses.' });
  }
  if (ctx.tokenContracts.some((a) => lc(a) === lc(to))) {
    out.push({
      level: 'warn',
      code: 'token_contract',
      message: 'This is a token contract address. Tokens sent to a token contract are usually lost for good.',
    });
  } else if (ctx.recipientIsContract) {
    out.push({
      level: 'warn',
      code: 'token_contract',
      message: 'This address is a smart contract. Make sure it can receive funds, otherwise they may be stuck.',
    });
  }

  const contact = ctx.contacts.find((c) => lc(c.address) === lc(to));
  if (contact) {
    out.push({ level: 'info', code: 'known_contact', message: `Saved contact: ${contact.name}` });
  } else {
    const sentBefore = ctx.transactions.some((t) => t.type === 'send' && lc(t.to) === lc(to));
    if (!sentBefore) {
      out.push({ level: 'warn', code: 'new_recipient', message: "You haven't sent to this address before. Double-check every character." });
    }
  }

  const known = [...ctx.contacts.map((c) => c.address), ...ctx.transactions.filter((t) => t.type === 'send').map((t) => t.to)];
  const twin = known.find((k) => isLookalike(k, to));
  if (twin) {
    out.push({
      level: 'warn',
      code: 'lookalike',
      message: `Looks similar to ${twin.slice(0, 8)}…${twin.slice(-6)}, an address you've used. Scammers copy the start and end of addresses.`,
    });
  }
  return out;
}
