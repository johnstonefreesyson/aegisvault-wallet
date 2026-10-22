import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { lifiBridgeService, BridgeRoute } from '../../services/bridge/lifiBridgeService';

export const BridgeScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { activeAddress, showToast } = useWallet();

  const chains = [
    { id: 'ethereum', name: 'Ethereum', icon: 'ETH', color: '#627EEA' },
    { id: 'polygon', name: 'Polygon', icon: 'POL', color: '#8247E5' },
    { id: 'bsc', name: 'BNB Chain', icon: 'BNB', color: '#F0B90B' },
    { id: 'arbitrum', name: 'Arbitrum', icon: 'ARB', color: '#28A0F0' },
    { id: 'optimism', name: 'Optimism', icon: 'OP', color: '#FF0420' },
    { id: 'base', name: 'Base', icon: 'BASE', color: '#0052FF' },
  ];

  const tokens = ['ETH', 'USDC', 'USDT', 'WBTC'];

  const [fromChain, setFromChain] = useState(chains[0].name);
  const [toChain, setToChain] = useState(chains[1].name);
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('ETH');
  const [amount, setAmount] = useState('0.5');

  const [routes, setRoutes] = useState<BridgeRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<BridgeRoute | null>(null);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Execution modal state
  const [isExecuting, setIsExecuting] = useState(false);
  const [execStep, setExecStep] = useState(0);

  const fetchRoutes = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoadingRoutes(true);
    try {
      const results = await lifiBridgeService.getBridgeRoutes({
        fromChain,
        fromToken,
        toChain,
        toToken,
        amount,
      });
      setRoutes(results);
      setSelectedRoute(results[0] || null);
    } catch {
      showToast('Could not fetch bridge routes', 'error');
    } finally {
      setLoadingRoutes(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [fromChain, toChain, fromToken, toToken, amount]);

  const handleSwapChains = () => {
    const temp = fromChain;
    setFromChain(toChain);
    setToChain(temp);
  };

  const handleExecuteBridge = () => {
    if (!selectedRoute) return;
    setIsExecuting(true);
    setExecStep(1);

    // Simulate multi-step bridging progression
    setTimeout(() => {
      setExecStep(2);
      setTimeout(() => {
        setExecStep(3);
        setTimeout(() => {
          setExecStep(4);
          showToast(`Bridge transfer complete! Funds received on ${toChain}.`, 'success');
        }, 3000);
      }, 2500);
    }, 2000);
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
          <h1 className="text-base font-bold text-ink">Cross-Chain Bridge</h1>
          <p className="text-[11px] text-muted">Powered by LI.FI Protocol Aggregation</p>
        </div>
        <button
          onClick={fetchRoutes}
          className="p-2 text-slate-400 hover:text-ink rounded-xl transition-colors"
          title="Refresh quotes"
        >
          <RefreshCw size={18} className={loadingRoutes ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Main Bridge Form */}
      <div className="space-y-4 max-w-lg mx-auto w-full">
        {/* FROM BLOCK */}
        <div className="p-4 rounded-3xl bg-card border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-semibold">From Network & Asset</span>
            <span className="font-mono">Sender: {activeAddress ? `${activeAddress.slice(0, 6)}…` : ''}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={fromChain}
              onChange={(e) => setFromChain(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-ink focus:outline-none"
            >
              {chains.map((c) => (
                <option key={c.id} value={c.name} disabled={c.name === toChain}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={fromToken}
              onChange={(e) => setFromToken(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-ink focus:outline-none"
            >
              {tokens.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-muted block mb-1">Transfer Amount</label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-2xl font-bold font-mono text-ink bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* SWAP DIRECTION BUTTON */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleSwapChains}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-md text-slate-600 hover:text-coral hover:scale-105 transition-all flex items-center justify-center"
            title="Swap direction"
          >
            <ArrowLeftRight size={16} />
          </button>
        </div>

        {/* TO BLOCK */}
        <div className="p-4 rounded-3xl bg-card border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-semibold">To Destination Network & Asset</span>
            <span className="font-mono">Est. Received</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={toChain}
              onChange={(e) => setToChain(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-ink focus:outline-none"
            >
              {chains.map((c) => (
                <option key={c.id} value={c.name} disabled={c.name === fromChain}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-ink focus:outline-none"
            >
              {tokens.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-2xl font-bold font-mono text-coral">
              {selectedRoute ? selectedRoute.toAmount : '—'} {toToken}
            </span>
            <span className="text-xs text-muted font-mono">
              ~{selectedRoute ? `${selectedRoute.estimatedDurationSeconds}s` : ''}
            </span>
          </div>
        </div>

        {/* ROUTE COMPARISON CARDS */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              Available Bridge Aggregations ({routes.length})
            </span>
            <span className="text-[11px] text-muted">Auto-optimized</span>
          </div>

          {loadingRoutes ? (
            <div className="py-8 text-center text-xs text-muted">
              <RefreshCw size={18} className="animate-spin mx-auto text-coral mb-1" />
              <span>Finding best cross-chain routes…</span>
            </div>
          ) : (
            routes.map((route) => {
              const isSelected = selectedRoute?.id === route.id;
              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRoute(route)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-peach/20 border-coral shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink">{route.bridgeName}</span>
                      {route.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold ${
                            tag === 'RECOMMENDED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tag === 'FASTEST'
                              ? 'bg-sky/20 text-sky'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-ink block">
                        {route.toAmount} {route.toToken}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> ~{Math.round(route.estimatedDurationSeconds / 60)} mins
                    </span>
                    <span>
                      Fee: ${route.bridgeFeeUSD} • Gas: ${route.gasCostUSD}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* BRIDGE ACTION BUTTON */}
        <button
          onClick={handleExecuteBridge}
          disabled={!selectedRoute || loadingRoutes}
          className="btn-primary w-full h-12 text-xs font-bold uppercase tracking-wider mt-4"
        >
          <span>Bridge {amount} {fromToken} across chains</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* EXECUTION MODAL */}
      {isExecuting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="text-center">
              <h3 className="text-base font-bold text-ink">Cross-Chain Bridge Transfer</h3>
              <p className="text-xs text-muted">
                Transferring from {fromChain} to {toChain} via {selectedRoute?.bridgeName}
              </p>
            </div>

            {/* Stepper */}
            <div className="space-y-3.5 py-2">
              {[
                { title: `Deposit ${fromToken} on ${fromChain}`, desc: 'Submitting transaction to source pool' },
                { title: 'Relayer Consensus & Attestation', desc: 'Cross-chain protocol verification' },
                { title: `Mint & Deliver on ${toChain}`, desc: `Releasing ${toToken} to your recipient address` },
              ].map((step, idx) => {
                const stepNum = idx + 1;
                const isDone = execStep > stepNum;
                const isCurrent = execStep === stepNum;

                return (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-[11px] transition-all ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-coral text-white animate-pulse'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isDone ? <CheckCircle2 size={14} /> : stepNum}
                    </div>
                    <div>
                      <span className={`font-bold block ${isCurrent ? 'text-coral' : isDone ? 'text-ink' : 'text-slate-400'}`}>
                        {step.title}
                      </span>
                      <span className="text-[11px] text-muted">{step.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {execStep >= 4 ? (
              <button
                onClick={() => setIsExecuting(false)}
                className="btn-primary w-full h-11 text-xs"
              >
                Done
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-muted flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin text-coral" />
                <span>Bridge processing in background…</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
