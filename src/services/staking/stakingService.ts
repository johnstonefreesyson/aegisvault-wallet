export interface Validator {
  id: string;
  name: string;
  chain: string;
  logo: string;
  apy: number;
  commission: number; // percentage
  uptime: number; // percentage
  votingPower: string;
}

export interface StakedPosition {
  id: string;
  chain: string;
  assetSymbol: string;
  validatorName: string;
  stakedAmount: string;
  stakedUSD: number;
  pendingRewards: string;
  pendingRewardsUSD: number;
  apy: number;
  status: 'active' | 'unbonding';
  unbondingRemainingDays?: number;
}

export interface StakingPool {
  id: string;
  name: string;
  chain: string;
  symbol: string;
  apy: number;
  lockupDays: number;
  minAmount: string;
  isLiquidStaking?: boolean;
  liquidTokenSymbol?: string;
  validators: Validator[];
}

export const STAKING_POOLS: StakingPool[] = [
  {
    id: 'eth_lido',
    name: 'Ethereum Liquid Staking',
    chain: 'Ethereum',
    symbol: 'ETH',
    apy: 3.4,
    lockupDays: 0,
    minAmount: '0.01',
    isLiquidStaking: true,
    liquidTokenSymbol: 'stETH',
    validators: [
      { id: 'lido', name: 'Lido DAO Protocol', chain: 'Ethereum', logo: 'https://cryptologos.cc/logos/lido-dao-ldo-logo.png', apy: 3.4, commission: 10, uptime: 100, votingPower: '32% of staked ETH' },
      { id: 'rocketpool', name: 'Rocket Pool (rETH)', chain: 'Ethereum', logo: 'https://cryptologos.cc/logos/rocket-pool-rpl-logo.png', apy: 3.7, commission: 15, uptime: 99.9, votingPower: '8% of staked ETH' },
    ],
  },
  {
    id: 'sol_native',
    name: 'Solana PoS Staking',
    chain: 'Solana',
    symbol: 'SOL',
    apy: 7.2,
    lockupDays: 3,
    minAmount: '0.1',
    validators: [
      { id: 'jito', name: 'Jito Labs (MEV Rewards)', chain: 'Solana', logo: 'https://cryptologos.cc/logos/solana-sol-logo.png', apy: 7.4, commission: 0, uptime: 99.9, votingPower: '14.2M SOL' },
      { id: 'marinade', name: 'Marinade Native', chain: 'Solana', logo: 'https://cryptologos.cc/logos/solana-sol-logo.png', apy: 7.1, commission: 2, uptime: 99.8, votingPower: '8.5M SOL' },
      { id: 'coinbase', name: 'Coinbase Cloud', chain: 'Solana', logo: 'https://cryptologos.cc/logos/solana-sol-logo.png', apy: 6.8, commission: 8, uptime: 100, votingPower: '18.1M SOL' },
      { id: 'everstake_sol', name: 'Everstake', chain: 'Solana', logo: 'https://cryptologos.cc/logos/solana-sol-logo.png', apy: 7.0, commission: 5, uptime: 99.9, votingPower: '9.4M SOL' },
    ],
  },
  {
    id: 'atom_native',
    name: 'Cosmos Hub Staking',
    chain: 'Cosmos',
    symbol: 'ATOM',
    apy: 14.8,
    lockupDays: 21,
    minAmount: '0.5',
    validators: [
      { id: 'cosmostation', name: 'Cosmostation', chain: 'Cosmos', logo: 'https://cryptologos.cc/logos/cosmos-atom-logo.png', apy: 14.8, commission: 5, uptime: 99.9, votingPower: '12.4M ATOM' },
      { id: 'polkachu', name: 'Polkachu', chain: 'Cosmos', logo: 'https://cryptologos.cc/logos/cosmos-atom-logo.png', apy: 14.9, commission: 5, uptime: 100, votingPower: '7.1M ATOM' },
      { id: 'keplr_val', name: 'Keplr Community', chain: 'Cosmos', logo: 'https://cryptologos.cc/logos/cosmos-atom-logo.png', apy: 14.6, commission: 5, uptime: 99.8, votingPower: '15.6M ATOM' },
    ],
  },
  {
    id: 'bnb_native',
    name: 'BNB Smart Chain Staking',
    chain: 'BNB Chain',
    symbol: 'BNB',
    apy: 4.5,
    lockupDays: 7,
    minAmount: '0.1',
    validators: [
      { id: 'binance_staking', name: 'Binance Staking Validator', chain: 'BNB Chain', logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png', apy: 4.6, commission: 5, uptime: 100, votingPower: '1.2M BNB' },
      { id: 'nodereal', name: 'NodeReal', chain: 'BNB Chain', logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png', apy: 4.4, commission: 5, uptime: 99.9, votingPower: '750k BNB' },
      { id: 'legend', name: 'Legend Validator', chain: 'BNB Chain', logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png', apy: 4.5, commission: 3, uptime: 99.8, votingPower: '620k BNB' },
    ],
  },
  {
    id: 'trx_native',
    name: 'TRON Super Representative Voting',
    chain: 'TRON',
    symbol: 'TRX',
    apy: 5.1,
    lockupDays: 14,
    minAmount: '100',
    validators: [
      { id: 'tronlink_sr', name: 'TronLink SR', chain: 'TRON', logo: 'https://cryptologos.cc/logos/tron-trx-logo.png', apy: 5.2, commission: 10, uptime: 100, votingPower: '850M Votes' },
      { id: 'binance_tron', name: 'Binance Staking SR', chain: 'TRON', logo: 'https://cryptologos.cc/logos/tron-trx-logo.png', apy: 5.0, commission: 8, uptime: 100, votingPower: '1.2B Votes' },
    ],
  },
  {
    id: 'xtz_native',
    name: 'Tezos Baking (LPoS)',
    chain: 'Tezos',
    symbol: 'XTZ',
    apy: 5.6,
    lockupDays: 0,
    minAmount: '1',
    validators: [
      { id: 'tezos_baking_club', name: 'Tezos Baking Club', chain: 'Tezos', logo: 'https://cryptologos.cc/logos/tezos-xtz-logo.png', apy: 5.6, commission: 7, uptime: 99.8, votingPower: '4.2M XTZ' },
      { id: 'everstake_xtz', name: 'Everstake Tezos', chain: 'Tezos', logo: 'https://cryptologos.cc/logos/tezos-xtz-logo.png', apy: 5.5, commission: 8, uptime: 100, votingPower: '6.8M XTZ' },
    ],
  },
];

class StakingService {
  private userPositions: StakedPosition[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const raw = localStorage.getItem('aegisvault_staked_positions');
      if (raw) {
        this.userPositions = JSON.parse(raw);
      }
    } catch {
      this.userPositions = [];
    }
  }

  private saveState() {
    try {
      localStorage.setItem('aegisvault_staked_positions', JSON.stringify(this.userPositions));
    } catch {
      // ignore
    }
    this.notify();
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getPositions(): StakedPosition[] {
    return [...this.userPositions];
  }

  public async delegate(params: {
    poolId: string;
    validatorId: string;
    amount: string;
    priceUSD: number;
  }): Promise<StakedPosition> {
    const pool = STAKING_POOLS.find((p) => p.id === params.poolId);
    if (!pool) throw new Error('Staking pool not found');

    const validator = pool.validators.find((v) => v.id === params.validatorId) || pool.validators[0];
    const numAmount = parseFloat(params.amount) || 0;

    const position: StakedPosition = {
      id: `pos_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      chain: pool.chain,
      assetSymbol: pool.symbol,
      validatorName: validator.name,
      stakedAmount: params.amount,
      stakedUSD: numAmount * params.priceUSD,
      pendingRewards: (numAmount * (validator.apy / 100 / 365) * 2).toFixed(5), // initial accrual simulation
      pendingRewardsUSD: (numAmount * (validator.apy / 100 / 365) * 2) * params.priceUSD,
      apy: validator.apy,
      status: 'active',
    };

    this.userPositions.unshift(position);
    this.saveState();
    return position;
  }

  public async unstake(positionId: string): Promise<void> {
    const idx = this.userPositions.findIndex((p) => p.id === positionId);
    if (idx === -1) throw new Error('Staked position not found');

    const pos = this.userPositions[idx];
    if (pos.chain === 'Ethereum' || pos.chain === 'Tezos') {
      // Liquid staking / Tezos unbonds immediately
      this.userPositions.splice(idx, 1);
    } else {
      // Mark as unbonding
      this.userPositions[idx] = {
        ...pos,
        status: 'unbonding',
        unbondingRemainingDays: pos.chain === 'Cosmos' ? 21 : pos.chain === 'TRON' ? 14 : 3,
      };
    }
    this.saveState();
  }

  public async claimRewards(positionId: string): Promise<string> {
    const pos = this.userPositions.find((p) => p.id === positionId);
    if (!pos) throw new Error('Staked position not found');

    const claimed = pos.pendingRewards;
    pos.pendingRewards = '0.00000';
    pos.pendingRewardsUSD = 0;
    this.saveState();
    return claimed;
  }
}

export const stakingService = new StakingService();
