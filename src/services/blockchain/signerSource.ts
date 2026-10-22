import { ethers } from 'ethers';

/** Something that can sign: a decrypted private key or a ready ethers Signer. */
export type KeyOrSigner = string | ethers.Signer;

export function asSigner(source: KeyOrSigner, provider: ethers.Provider): ethers.Signer {
  return typeof source === 'string' ? new ethers.Wallet(source, provider) : source.connect(provider);
}
