import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret, LEGACY_KDF_ITERATIONS } from '../src/services/storage/cryptoUtils';

describe('cryptoUtils', () => {
  it('round-trips a secret with the right passcode', async () => {
    const enc = await encryptSecret('top secret', 'correct horse', 1000);
    const out = await decryptSecret(enc.ciphertext, 'correct horse', enc.salt, enc.iv, enc.iterations);
    expect(out).toBe('top secret');
  });

  it('rejects the wrong passcode', async () => {
    const enc = await encryptSecret('top secret', 'correct horse', 1000);
    await expect(decryptSecret(enc.ciphertext, 'wrong', enc.salt, enc.iv, enc.iterations)).rejects.toBeTruthy();
  });

  it('uses a fresh salt and iv each time', async () => {
    const a = await encryptSecret('x', 'pw', 1000);
    const b = await encryptSecret('x', 'pw', 1000);
    expect(a.salt).not.toBe(b.salt);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('defaults to a strong iteration count for new secrets but can read legacy ones', async () => {
    const enc = await encryptSecret('legacy', 'pw', LEGACY_KDF_ITERATIONS);
    // old vaults have no stored iteration count -> decrypt falls back to the legacy value
    expect(await decryptSecret(enc.ciphertext, 'pw', enc.salt, enc.iv)).toBe('legacy');
  });
});
