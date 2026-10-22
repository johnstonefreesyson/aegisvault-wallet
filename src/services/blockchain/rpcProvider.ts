import { ethers } from 'ethers';
import { SUPPORTED_NETWORKS } from '../../config/networks';
import { SupportedChainId } from '../../types';

/**
 * One FallbackProvider per chain, backed by every configured RPC URL.
 * quorum = 1 means "first healthy endpoint wins", so a 401 / CORS failure /
 * timeout on one endpoint is skipped automatically instead of failing the call.
 *
 * Optional override per chain (put your own Alchemy/Infura/etc. URL in .env):
 *   VITE_RPC_URL_<chainId>, e.g. VITE_RPC_URL_1, VITE_RPC_URL_8453
 */
class RPCProviderService {
  private providers: Map<SupportedChainId, ethers.AbstractProvider> = new Map();

  private urlsFor(chainId: SupportedChainId): string[] {
    const network = SUPPORTED_NETWORKS[chainId];
    if (!network || !network.rpcUrls.length) {
      throw new Error(`Unsupported chain ID or missing RPC configuration: ${chainId}`);
    }
    const override = (import.meta as any).env?.[`VITE_RPC_URL_${chainId}`] as string | undefined;
    return override ? [override, ...network.rpcUrls] : network.rpcUrls;
  }

  getProvider(chainId: SupportedChainId): ethers.AbstractProvider {
    const existing = this.providers.get(chainId);
    if (existing) return existing;

    const network = SUPPORTED_NETWORKS[chainId];
    const net = { chainId: network.chainId, name: network.id };

    const configs = this.urlsFor(chainId).map((url, i) => ({
      provider: new ethers.JsonRpcProvider(url, net, {
        staticNetwork: ethers.Network.from(net),
        batchMaxCount: 1, // some free RPCs mishandle batched requests
      }),
      priority: i + 1,
      stallTimeout: 1500, // ms before trying the next endpoint
      weight: 1,
    }));

    const provider =
      configs.length === 1
        ? configs[0].provider
        : new ethers.FallbackProvider(configs, ethers.Network.from(net), { quorum: 1 });

    this.providers.set(chainId, provider);
    return provider;
  }

  /** Kept for API compatibility: FallbackProvider already rotates endpoints. */
  rotateRpc(chainId: SupportedChainId): ethers.AbstractProvider {
    return this.getProvider(chainId);
  }

  async getNativeBalance(chainId: SupportedChainId, address: string): Promise<string> {
    const balance = await this.getProvider(chainId).getBalance(address);
    return ethers.formatEther(balance);
  }

  async getGasFeeData(chainId: SupportedChainId) {
    return this.getProvider(chainId).getFeeData();
  }

  async getTransactionReceipt(chainId: SupportedChainId, hash: string) {
    return this.getProvider(chainId).getTransactionReceipt(hash);
  }

  async getBlockNumber(chainId: SupportedChainId): Promise<number> {
    return this.getProvider(chainId).getBlockNumber();
  }
}

export const rpcService = new RPCProviderService();
