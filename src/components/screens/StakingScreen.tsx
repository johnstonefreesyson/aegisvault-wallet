import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Coins,
  TrendingUp,
  ShieldCheck,
  Award,
  Clock,
  Sparkles,
  ChevronRight,
  Gift,
  ArrowDownLeft,
  X,
  AlertCircle,
  Percent,
} from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import {
  stakingService,
  STAKING_POOLS,
  StakingPool,
  Validator,
  StakedPosition,
} from '../../services/staking/stakingService';

export const StakingScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { showToast, fiat } = useWallet();
  const [positions, setPositions] = useState<StakedPosition[]>(() => stakingService.getPositions());
  const [activeTab, setActiveTab] = useState<'pools' | 'positions'>('pools');
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);

  useEffect(() => {
    const unsub = stakingService.subscribe(() => {
      setPositions(stakingService.getPositions());
    });
    return unsub;
  }, []);

  const totalStakedUSD = positions.reduce((acc, p) => acc + (p.status === 'active' ? p.stakedUSD : 0), 0);
  const totalRewardsUSD = positions.reduce((acc, p) => acc + p.pendingRewardsUSD, 0);

  const tokenPrices: Record<string, number> = {
    ETH: 3100,
    SOL: 148,
    ATOM: 4.8,
    BNB: 580,
    TRX: 0.16,
    XTZ: 0.95,
  };

  const handleOpenStakeModal = (pool: StakingPool) => {
    setSelectedPool(pool);
    setSelectedValidator(pool.validators[0]);
    setStakeAmount(pool.minAmount);
  };

  const handleConfirmStake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPool || !selectedValidator || !stakeAmount) return;

    setIsStaking(true);
    try {
      const price = tokenPrices[selectedPool.symbol] || 100;
      await stakingService.delegate({
        poolId: selectedPool.id,
        validatorId: selectedValidator.id,
        amount: stakeAmount,
        priceUSD: price,
      });
      showToast(`Successfully staked ${stakeAmount} ${selectedPool.symbol}!`, 'success');
      setSelectedPool(null);
      setActiveTab('positions');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Staking failed';
      showToast(msg, 'error');
    } finally {
      setIsStaking(false);
    }
  };

  const handleClaim = async (positionId: string) => {
    try {
      const amt = await stakingService.claimRewards(positionId);
      showToast(`Claimed ${amt} in staking rewards!`, 'success');
    } catch {
      showToast('Could not claim rewards', 'error');
    }
  };

  const handleUnstake = async (positionId: string) => {
    try {
      await stakingService.unstake(positionId);
      showToast('Unstake request submitted', 'info');
    } catch {
      showToast('Could not unstake', 'error');
    }
  };

  return (
    <div className="min-h-[100dvh] page-wash pb-28 px-4 md:px-10 lg:px-[10%] pt-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-ink hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-base font-bold text-ink">Earn & Staking</h1>
          <p className="text-[11px] text-muted">Native PoS & Liquid Staking</p>
        </div>
        <div className="w-8" />
      </div>

      {/* Hero Overview */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1a2a52] to-[#0f1a38] text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-peach/20 blur-xl pointer-events-none" />
        <div className="flex items-center justify-between text-xs text-white/70 mb-1">
          <span>Total Staked Value</span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <TrendingUp size={14} /> Earn up to 14.8% APY
          </span>
        </div>
        <div className="text-3xl font-bold font-mono tracking-tight mb-4">
          {fiat(totalStakedUSD)}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
          <div>
            <span className="text-white/60 block text-[11px]">Pending Rewards</span>
            <span className="font-bold text-coral text-sm font-mono">{fiat(totalRewardsUSD)}</span>
          </div>
          <div>
            <span className="text-white/60 block text-[11px]">Active Delegations</span>
            <span className="font-bold text-white text-sm font-mono">
              {positions.filter((p) => p.status === 'active').length} Positions
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-5">
        <button
          onClick={() => setActiveTab('pools')}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'pools' ? 'bg-white text-ink shadow-xs' : 'text-slate-500 hover:text-ink'
          }`}
        >
          Staking Assets ({STAKING_POOLS.length})
        </button>
        <button
          onClick={() => setActiveTab('positions')}
          className={`py-2 text-xs font-bold rounded-xl transition-all relative ${
            activeTab === 'positions' ? 'bg-white text-ink shadow-xs' : 'text-slate-500 hover:text-ink'
          }`}
        >
          My Stakes ({positions.length})
          {positions.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-4" />
          )}
        </button>
      </div>

      {/* TAB 1: Pools */}
      {activeTab === 'pools' && (
        <div className="space-y-3">
          {STAKING_POOLS.map((pool) => (
            <div
              key={pool.id}
              onClick={() => handleOpenStakeModal(pool)}
              className="p-4 rounded-3xl bg-card border border-slate-200/80 shadow-xs hover:border-coral/60 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-peach/40 flex items-center justify-center font-bold text-xs text-ink shadow-2xs">
                  {pool.symbol}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-ink group-hover:text-coral transition-colors">
                      {pool.name}
                    </h3>
                    {pool.isLiquidStaking && (
                      <span className="text-[9px] bg-sky/15 text-navy font-bold px-1.5 py-0.2 rounded-md">
                        LIQUID
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted">
                    Lockup: {pool.lockupDays === 0 ? 'None (Instant)' : `${pool.lockupDays} days`} • Min: {pool.minAmount} {pool.symbol}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-600 block">
                    {pool.apy}% APY
                  </span>
                  <span className="text-[10px] text-muted">
                    {pool.validators.length} Validators
                  </span>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-coral transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: My Positions */}
      {activeTab === 'positions' && (
        <div className="space-y-3.5">
          {positions.length === 0 ? (
            <div className="py-16 px-4 bg-card rounded-3xl border border-slate-200 text-center">
              <Coins size={36} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-ink mb-1">No Active Stakes</h3>
              <p className="text-xs text-muted max-w-xs mx-auto mb-4">
                You haven't delegated any assets yet. Select a pool from the Staking Assets tab to start earning yields.
              </p>
              <button
                onClick={() => setActiveTab('pools')}
                className="btn-primary px-5 h-10 text-xs mx-auto inline-flex"
              >
                Explore Staking Pools
              </button>
            </div>
          ) : (
            positions.map((pos) => (
              <div
                key={pos.id}
                className="p-5 rounded-3xl bg-card border border-slate-200/80 shadow-xs space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-peach/40 flex items-center justify-center font-bold text-xs text-ink">
                      {pos.assetSymbol}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-ink">{pos.chain}</h4>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase ${
                            pos.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pos.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted">Validator: {pos.validatorName}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-ink block">
                      {pos.stakedAmount} {pos.assetSymbol}
                    </span>
                    <span className="text-[11px] text-muted">{fiat(pos.stakedUSD)}</span>
                  </div>
                </div>

                {/* Rewards callout */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted block text-[10px]">Unclaimed Rewards:</span>
                    <span className="font-bold text-emerald-600 font-mono">
                      {pos.pendingRewards} {pos.assetSymbol} ({fiat(pos.pendingRewardsUSD)})
                    </span>
                  </div>
                  {parseFloat(pos.pendingRewards) > 0 && (
                    <button
                      onClick={() => handleClaim(pos.id)}
                      className="px-3 py-1.5 rounded-xl bg-peach text-ink font-bold text-[11px] hover:bg-peach-hover transition-colors"
                    >
                      Claim
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                  {pos.status === 'active' && (
                    <button
                      onClick={() => handleUnstake(pos.id)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold p-1"
                    >
                      Unstake / Undelegate
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* DELEGATE MODAL */}
      {selectedPool && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 max-h-[92dvh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-ink">Stake {selectedPool.symbol}</h3>
                <span className="text-[11px] text-muted">{selectedPool.name}</span>
              </div>
              <button
                onClick={() => setSelectedPool(null)}
                className="p-1.5 text-slate-400 hover:text-ink rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmStake} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Stake Amount ({selectedPool.symbol})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-ink placeholder-slate-400 focus:outline-none focus:border-coral"
                    required
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">
                    {selectedPool.symbol}
                  </span>
                </div>
              </div>

              {/* Validator selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                  Select Validator
                </label>
                <div className="space-y-2">
                  {selectedPool.validators.map((val) => {
                    const isSelected = selectedValidator?.id === val.id;
                    return (
                      <div
                        key={val.id}
                        onClick={() => setSelectedValidator(val)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-peach/20 border-coral shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold text-ink block">{val.name}</span>
                          <span className="text-[10px] text-muted">
                            Commission: {val.commission}% • Uptime: {val.uptime}%
                          </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-600">
                          {val.apy}% APY
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Earnings preview */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-muted">
                  <span>Estimated Yearly Return:</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    {((parseFloat(stakeAmount) || 0) * ((selectedValidator?.apy || 5) / 100)).toFixed(4)} {selectedPool.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Lockup / Unbonding:</span>
                  <span className="text-ink font-semibold">
                    {selectedPool.lockupDays === 0 ? 'None (Liquid)' : `${selectedPool.lockupDays} Days`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPool(null)}
                  className="btn-secondary h-11 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
                  className="btn-primary h-11 text-xs"
                >
                  {isStaking ? 'Confirming...' : 'Delegate & Stake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
