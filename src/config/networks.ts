import { BlockchainNetwork, SupportedChainId, TokenMetadata } from '../types';

export const SUPPORTED_NETWORKS: Record<SupportedChainId, BlockchainNetwork> = {
  1: {
    id: 'ethereum',
    chainId: 1,
    name: 'Ethereum Mainnet',
    shortName: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://ethereum-rpc.publicnode.com',
      'https://eth.drpc.org',
      'https://1rpc.io/eth'
    ],
    blockExplorerUrl: 'https://etherscan.io',
    icon: 'eth',
    color: '#627EEA',
    isTestnet: false,
  },
  56: {
    id: 'bsc',
    chainId: 56,
    name: 'BNB Smart Chain',
    shortName: 'BNB Chain',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: [
      'https://bsc-rpc.publicnode.com',
      'https://bsc-dataseed1.binance.org',
      'https://bsc.drpc.org'
    ],
    blockExplorerUrl: 'https://bscscan.com',
    icon: 'bnb',
    color: '#F0B90B',
    isTestnet: false,
  },
  137: {
    id: 'polygon',
    chainId: 137,
    name: 'Polygon PoS Mainnet',
    shortName: 'Polygon',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'POL',
      decimals: 18,
    },
    rpcUrls: [
      'https://polygon-bor-rpc.publicnode.com',
      'https://polygon.drpc.org',
      'https://1rpc.io/matic'
    ],
    blockExplorerUrl: 'https://polygonscan.com',
    icon: 'polygon',
    color: '#8247E5',
    isTestnet: false,
  },
  42161: {
    id: 'arbitrum',
    chainId: 42161,
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://arbitrum-one-rpc.publicnode.com',
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum.drpc.org',
    ],
    blockExplorerUrl: 'https://arbiscan.io',
    icon: 'arb',
    color: '#28A0F0',
    isTestnet: false,
  },
  10: {
    id: 'optimism',
    chainId: 10,
    name: 'OP Mainnet',
    shortName: 'Optimism',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://optimism-rpc.publicnode.com',
      'https://mainnet.optimism.io',
      'https://optimism.drpc.org',
    ],
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    icon: 'op',
    color: '#FF0420',
    isTestnet: false,
  },
  8453: {
    id: 'base',
    chainId: 8453,
    name: 'Base',
    shortName: 'Base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://base-rpc.publicnode.com',
      'https://mainnet.base.org',
      'https://base.drpc.org',
    ],
    blockExplorerUrl: 'https://basescan.org',
    icon: 'base',
    color: '#0052FF',
    isTestnet: false,
  },
  43114: {
    id: 'avalanche',
    chainId: 43114,
    name: 'Avalanche C-Chain',
    shortName: 'Avalanche',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    rpcUrls: [
      'https://avalanche-c-chain-rpc.publicnode.com',
      'https://api.avax.network/ext/bc/C/rpc',
      'https://avalanche.drpc.org',
    ],
    blockExplorerUrl: 'https://snowtrace.io',
    icon: 'avax',
    color: '#E84142',
    isTestnet: false,
  },
  11155111: {
    id: 'sepolia',
    chainId: 11155111,
    name: 'Ethereum Sepolia Testnet',
    shortName: 'Sepolia',
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://sepolia.drpc.org',
      'https://1rpc.io/sepolia'
    ],
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    icon: 'eth',
    color: '#3B82F6',
    isTestnet: true,
  },
};

export const DEFAULT_CHAIN_ID: SupportedChainId = 1;

export const DEFAULT_TOKENS: Record<SupportedChainId, TokenMetadata[]> = {
  // Ethereum
  1: [
    {
      address: 'native',
      chainId: 1,
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      coingeckoId: 'ethereum',
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      chainId: 1,
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      coingeckoId: 'tether',
    },
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      chainId: 1,
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      coingeckoId: 'usd-coin',
    },
    {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      chainId: 1,
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      coingeckoId: 'dai',
    },
    {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      chainId: 1,
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      coingeckoId: 'wrapped-bitcoin',
    },
    {
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      chainId: 1,
      symbol: 'LINK',
      name: 'Chainlink',
      decimals: 18,
      coingeckoId: 'chainlink',
    },
  ],
  // BNB Chain
  56: [
    {
      address: 'native',
      chainId: 56,
      symbol: 'BNB',
      name: 'BNB',
      decimals: 18,
      coingeckoId: 'binancecoin',
    },
    {
      address: '0x55d398326f99059fF775485246999027B3197955',
      chainId: 56,
      symbol: 'USDT',
      name: 'Tether USD (BSC)',
      decimals: 18,
      coingeckoId: 'tether',
    },
    {
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      chainId: 56,
      symbol: 'USDC',
      name: 'USD Coin (BSC)',
      decimals: 18,
      coingeckoId: 'usd-coin',
    },
    {
      address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
      chainId: 56,
      symbol: 'CAKE',
      name: 'PancakeSwap Token',
      decimals: 18,
      coingeckoId: 'pancakeswap-token',
    },
  ],
  // Polygon PoS
  137: [
    {
      address: 'native',
      chainId: 137,
      symbol: 'POL',
      name: 'Polygon',
      decimals: 18,
      coingeckoId: 'matic-network',
    },
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      chainId: 137,
      symbol: 'USDT',
      name: 'Tether USD (Polygon)',
      decimals: 6,
      coingeckoId: 'tether',
    },
    {
      address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      chainId: 137,
      symbol: 'USDC',
      name: 'USD Coin (Polygon)',
      decimals: 6,
      coingeckoId: 'usd-coin',
    },
    {
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      chainId: 137,
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      coingeckoId: 'weth',
    },
  ],
  // Arbitrum One
  42161: [
    { address: 'native', chainId: 42161, symbol: 'ETH', name: 'Ethereum', decimals: 18, coingeckoId: 'ethereum' },
    { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', chainId: 42161, symbol: 'USDC', name: 'USD Coin', decimals: 6, coingeckoId: 'usd-coin' },
    { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', chainId: 42161, symbol: 'USDT', name: 'Tether USD', decimals: 6, coingeckoId: 'tether' },
    { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', chainId: 42161, symbol: 'ARB', name: 'Arbitrum', decimals: 18, coingeckoId: 'arbitrum' },
    { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', chainId: 42161, symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, coingeckoId: 'dai' },
    { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', chainId: 42161, symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, coingeckoId: 'wrapped-bitcoin' },
  ],
  // OP Mainnet
  10: [
    { address: 'native', chainId: 10, symbol: 'ETH', name: 'Ethereum', decimals: 18, coingeckoId: 'ethereum' },
    { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', chainId: 10, symbol: 'USDC', name: 'USD Coin', decimals: 6, coingeckoId: 'usd-coin' },
    { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', chainId: 10, symbol: 'USDT', name: 'Tether USD', decimals: 6, coingeckoId: 'tether' },
    { address: '0x4200000000000000000000000000000000000042', chainId: 10, symbol: 'OP', name: 'Optimism', decimals: 18, coingeckoId: 'optimism' },
    { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', chainId: 10, symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, coingeckoId: 'dai' },
  ],
  // Base
  8453: [
    { address: 'native', chainId: 8453, symbol: 'ETH', name: 'Ethereum', decimals: 18, coingeckoId: 'ethereum' },
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', chainId: 8453, symbol: 'USDC', name: 'USD Coin', decimals: 6, coingeckoId: 'usd-coin' },
    { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', chainId: 8453, symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, coingeckoId: 'dai' },
    { address: '0x4200000000000000000000000000000000000006', chainId: 8453, symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, coingeckoId: 'weth' },
    { address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', chainId: 8453, symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', decimals: 8, coingeckoId: 'coinbase-wrapped-btc' },
  ],
  // Avalanche C-Chain
  43114: [
    { address: 'native', chainId: 43114, symbol: 'AVAX', name: 'Avalanche', decimals: 18, coingeckoId: 'avalanche-2' },
    { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', chainId: 43114, symbol: 'USDC', name: 'USD Coin', decimals: 6, coingeckoId: 'usd-coin' },
    { address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', chainId: 43114, symbol: 'USDT', name: 'Tether USD', decimals: 6, coingeckoId: 'tether' },
    { address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', chainId: 43114, symbol: 'WAVAX', name: 'Wrapped AVAX', decimals: 18, coingeckoId: 'wrapped-avax' },
  ],
  // Sepolia Testnet
  11155111: [
    {
      address: 'native',
      chainId: 11155111,
      symbol: 'ETH',
      name: 'Sepolia Ether',
      decimals: 18,
      coingeckoId: 'ethereum',
    },
    {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      chainId: 11155111,
      symbol: 'USDC',
      name: 'Sepolia USD Coin',
      decimals: 6,
      coingeckoId: 'usd-coin',
    },
  ],
};

export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];
