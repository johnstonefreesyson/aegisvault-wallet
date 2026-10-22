/**
 * Cryptographic utility for securing seed phrases and private keys
 * Uses Web Crypto API (SubtleCrypto) with AES-GCM 256-bit and PBKDF2 key derivation.
 */

export const LEGACY_KDF_ITERATIONS = 100_000;
export const DEFAULT_KDF_ITERATIONS = 600_000; // OWASP guidance for PBKDF2-HMAC-SHA256

export async function deriveEncryptionKey(
  password: string,
  salt: Uint8Array,
  iterations: number = LEGACY_KDF_ITERATIONS
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptSecret(
  secret: string,
  password: string,
  iterations: number = DEFAULT_KDF_ITERATIONS
): Promise<{ ciphertext: string; salt: string; iv: string; iterations: number }> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveEncryptionKey(password, salt, iterations);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(secret)
  );

  return {
    ciphertext: bufferToBase64(new Uint8Array(encrypted)),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    iterations,
  };
}

export async function decryptSecret(
  ciphertext: string,
  password: string,
  salt: string,
  iv: string,
  iterations: number = LEGACY_KDF_ITERATIONS
): Promise<string> {
  const saltBytes = base64ToBuffer(salt);
  const ivBytes = base64ToBuffer(iv);
  const dataBytes = base64ToBuffer(ciphertext);

  const key = await deriveEncryptionKey(password, saltBytes, iterations);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes as BufferSource },
    key,
    dataBytes as BufferSource
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

function bufferToBase64(buf: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buf.byteLength; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
