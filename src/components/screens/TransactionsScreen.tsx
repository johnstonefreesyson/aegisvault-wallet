import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { WalletTransaction } from '../../types';
import { SUPPORTED_NETWORKS } from '../../config/networks';
import { rpcService } from '../../services/blockchain/rpcProvider';

export const TransactionsScreen: React.FC = () => {
  const { transactions, setSelectedTx, setCurrentScreen, activeNetwork, showToast } = useWallet();
  const [filterType, setFilterType] = useState<'all' | 'send' | 'receive'>('all');
  const [search, setSearch] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const filtered = transactions.filter((tx) => {
    const matchesFilter = filterType === 'all' || tx.type === filterType;
    const matchesSearch =
      tx.hash.toLowerCase().includes(search.toLowerCase()) ||
      tx.symbol.toLowerCase().includes(search.toLowerCase()) ||
      tx.to.toLowerCase().includes(search.toLowerCase()) ||
      tx.from.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSelect = (tx: WalletTransaction) => {
    setSelectedTx(tx);
    setCurrentScreen('transaction_details');
  };

  const handleRefreshPending = async () => {
    setIsCheckingStatus(true);
    try {
      const pendingTxs = transactions.filter((t) => t.status === 'pending');
      for (const p of pendingTxs) {
        const receipt = await rpcService.getTransactionReceipt(p.chainId, p.hash);
        if (receipt) {
          p.status = receipt.status === 1 ? 'confirmed' : 'reverted';
          p.blockNumber = receipt.blockNumber;
        }
      }
      showToast('Checked blockchain for pending receipts', 'info');
    } catch {
      // Ignored
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="pb-28 px-4 sm:px-6 md:px-8 pt-4 w-full md:px-10 lg:px-[10%] space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Transaction Activity</h2>
          <p className="text-xs text-slate-500">On-chain transfers recorded locally</p>
        </div>
        <button
          onClick={handleRefreshPending}
          disabled={isCheckingStatus}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
          title="Check status of transactions"
        >
          <RefreshCw size={15} className={isCheckingStatus ? 'animate-spin text-cyan-600' : ''} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button
          onClick={() => setFilterType('all')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
            filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setFilterType('send')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
            filterType === 'send' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Sent
        </button>
        <button
          onClick={() => setFilterType('receive')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
            filterType === 'receive' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Received
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by hash, symbol or address..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-xs"
        />
      </div>

      {/* Transaction List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <Clock size={28} className="mx-auto text-slate-400" />
            <h4 className="text-xs font-bold text-slate-700">No transactions recorded yet</h4>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Any transfers broadcasted from this wallet will be tracked and validated here.
            </p>
          </div>
        ) : (
          filtered.map((tx) => {
            const net = SUPPORTED_NETWORKS[tx.chainId] || activeNetwork;
            return (
              <button
                key={tx.hash}
                onClick={() => handleSelect(tx)}
                className="w-full p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs transition-all flex items-center justify-between gap-3 text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'send'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}
                  >
                    {tx.type === 'send' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 capitalize">
                        {tx.type === 'send' ? 'Sent' : 'Received'} {tx.symbol}
                      </span>
                      {tx.status === 'confirmed' ? (
                        <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                      ) : tx.status === 'pending' ? (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      ) : (
                        <AlertCircle size={12} className="text-rose-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono truncate block">
                      To: {tx.to.slice(0, 6)}...{tx.to.slice(-4)} · {net.shortName}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end text-right shrink-0">
                  <span
                    className={`text-xs font-bold font-mono ${
                      tx.type === 'send' ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {tx.type === 'send' ? '-' : '+'}
                    {tx.amount} {tx.symbol}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
