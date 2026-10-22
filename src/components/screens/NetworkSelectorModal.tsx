import React, { useState } from 'react';
import { X, Check, Search, Globe, Shield, ExternalLink } from 'lucide-react';
import { SUPPORTED_NETWORKS } from '../../config/networks';
import { SupportedChainId } from '../../types';
import { useWallet } from '../../store/WalletContext';

interface NetworkSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworkSelectorModal: React.FC<NetworkSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeChainId, switchNetwork } = useWallet();
  const [filter, setFilter] = useState<'all' | 'mainnet' | 'testnet'>('all');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const networksList = Object.values(SUPPORTED_NETWORKS).filter((net) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'mainnet' && !net.isTestnet) ||
      (filter === 'testnet' && net.isTestnet);
    const matchesSearch =
      net.name.toLowerCase().includes(search.toLowerCase()) ||
      net.nativeCurrency.symbol.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSelect = (chainId: SupportedChainId) => {
    switchNetwork(chainId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-md p-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-ink tracking-tight">Select Blockchain Network</h3>
            <p className="text-xs text-slate-400 mt-0.5">Switch active EVM chain & RPC endpoints</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-ink hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter & Search */}
        <div className="pt-3 pb-2 space-y-2.5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filter === 'all' ? 'bg-slate-100 text-ink shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              All Networks
            </button>
            <button
              onClick={() => setFilter('mainnet')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filter === 'mainnet' ? 'bg-slate-100 text-ink shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Mainnets
            </button>
            <button
              onClick={() => setFilter('testnet')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filter === 'testnet' ? 'bg-slate-100 text-ink shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Testnets
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search network..."
              className="w-full pl-8.5 pr-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-ink placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Network List */}
        <div className="overflow-y-auto space-y-2 py-2 flex-1 max-h-72">
          {networksList.map((net) => {
            const isSelected = activeChainId === net.chainId;
            return (
              <button
                key={net.chainId}
                onClick={() => handleSelect(net.chainId)}
                className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between text-left ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-ink shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: `${net.color}25`, color: net.color }}
                  >
                    {net.nativeCurrency.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink">{net.name}</span>
                      {net.isTestnet && (
                        <span className="text-[10px] text-blue-600 font-mono">Testnet</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Chain ID: {net.chainId} · Native: {net.nativeCurrency.symbol}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 flex items-center justify-center">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
