import { Request, Response } from 'express';
import { ethers } from 'ethers';

const RPC_ENDPOINTS: Record<number, string> = {
  1: 'https://cloudflare-eth.com',
  56: 'https://binance.llamarpc.com',
  137: 'https://polygon-rpc.com',
  11155111: 'https://rpc.sepolia.org',
};

export class BlockchainService {
  static async getBalance(req: Request, res: Response) {
    const chainId = parseInt(req.params.chainId, 10);
    const address = req.params.address;

    if (!ethers.isAddress(address)) {
      res.status(400).json({ error: 'Invalid EVM address format' });
      return;
    }

    const rpcUrl = RPC_ENDPOINTS[chainId];
    if (!rpcUrl) {
      res.status(400).json({ error: `Unsupported chain ID: ${chainId}` });
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const balanceWei = await provider.getBalance(address);
      const formatted = ethers.formatEther(balanceWei);

      res.json({
        success: true,
        chainId,
        address,
        balanceWei: balanceWei.toString(),
        formatted,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'RPC query failed';
      res.status(502).json({ error: msg });
    }
  }

  static async broadcastTransaction(req: Request, res: Response) {
    const { chainId, signedRawTx } = req.body;

    if (!signedRawTx || !signedRawTx.startsWith('0x')) {
      res.status(400).json({ error: 'Missing or invalid signedRawTx' });
      return;
    }

    const rpcUrl = RPC_ENDPOINTS[Number(chainId)];
    if (!rpcUrl) {
      res.status(400).json({ error: `Unsupported chain ID: ${chainId}` });
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const response = await provider.broadcastTransaction(signedRawTx);
      res.json({
        success: true,
        hash: response.hash,
        chainId,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Broadcast failed';
      res.status(500).json({ error: msg });
    }
  }
}
