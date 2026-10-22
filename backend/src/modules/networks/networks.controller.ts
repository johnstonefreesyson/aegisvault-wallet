import { Request, Response } from 'express';

export const SUPPORTED_NETWORKS_METADATA = [
  {
    chainId: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
    decimals: 18,
    isTestnet: false,
  },
  {
    chainId: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    blockExplorerUrl: 'https://bscscan.com',
    decimals: 18,
    isTestnet: false,
  },
  {
    chainId: 137,
    name: 'Polygon PoS Mainnet',
    symbol: 'POL',
    blockExplorerUrl: 'https://polygonscan.com',
    decimals: 18,
    isTestnet: false,
  },
  {
    chainId: 11155111,
    name: 'Ethereum Sepolia Testnet',
    symbol: 'ETH',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    decimals: 18,
    isTestnet: true,
  },
];

export class NetworksController {
  static listNetworks(req: Request, res: Response) {
    res.json({
      success: true,
      data: SUPPORTED_NETWORKS_METADATA,
    });
  }
}
