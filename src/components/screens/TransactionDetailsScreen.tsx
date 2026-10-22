import React, { useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { SUPPORTED_NETWORKS } from '../../config/networks';
import { rpcService } from '../../services/blockchain/rpcProvider';
import { TransactionService } from '../../services/blockchain/transactionService';
import { PasscodeSheet } from '../common/PasscodeSheet';
import { marketService } from '../../services/market/coingecko';
import { DEFAULT_TOKENS } from '../../config/networks';

interface TransactionDetailsScreenProps {
  onBack: () => void;
}

export const TransactionDetailsScreen: React.FC<TransactionDetailsScreenProps> = ({ onBack }) => {
  const { selectedTx, setSelectedTx, activeNetwork, showToast, refreshBalances, activeAddress } = useWallet();
  const [replaceMode, setReplaceMode] = useState<'speedup' | 'cancel' | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTx, setCurrentTx] = useState(selectedTx);

  if (!currentTx) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>No transaction selected.</p>
        <button onClick={onBack} className="text-cyan-600 text-xs mt-2 underline">
          Go back
        </button>
      </div>
    );
  }

  const network = SUPPORTED_NETWORKS[currentTx.chainId] || activeNetwork;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(currentTx.hash);
    setCopiedHash(true);
    showToast('Transaction hash copied', 'success');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleRefreshReceipt = async () => {
    setIsRefreshing(true);
    try {
      const receipt = await rpcService.getTransactionReceipt(currentTx.chainId, currentTx.hash);
      if (receipt) {
        const updated = {
          ...currentTx,
          status: receipt.status === 1 ? ('confirmed' as const) : ('reverted' as const),
          blockNumber: receipt.blockNumber,
        };
        setCurrentTx(updated);
        showToast('Status updated from blockchain', 'success');
      } else {
        showToast('Transaction is still pending on-chain', 'info');
      }
    } catch {
      showToast('Could not query RPC at this moment', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="pb-24 px-4 pt-3 md:px-10 lg:px-[10%] space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Transaction Details
        </span>
        <button
          onClick={handleRefreshReceipt}
          disabled={isRefreshing}
          className="p-2 -mr-2 rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
          title="Refresh transaction receipt"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-cyan-600' : ''} />
        </button>
      </div>

      {/* Hero Status Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
        <div
          className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
            currentTx.status === 'confirmed'
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : currentTx.status === 'pending'
              ? 'bg-amber-50 text-amber-600 border border-amber-200 animate-pulse'
              : 'bg-rose-50 text-rose-600 border border-rose-200'
          }`}
        >
          {currentTx.status === 'confirmed' ? (
            <CheckCircle2 size={30} />
          ) : currentTx.status === 'pending' ? (
            <Clock size={30} />
          ) : (
            <AlertCircle size={30} />
          )}
        </div>

        <div>
          <span className="text-2xl font-extrabold font-mono text-slate-900 block">
            {currentTx.type === 'send' ? '-' : '+'}
            {currentTx.amount} {currentTx.symbol}
          </span>
          <span
            className={`text-xs font-bold capitalize inline-block mt-1 ${
              currentTx.status === 'confirmed'
                ? 'text-emerald-600'
                : currentTx.status === 'pending'
                ? 'text-amber-600'
                : 'text-rose-600'
            }`}
          >
            Status: {currentTx.status}
          </span>
        </div>
      </div>

      {/* Specifications Breakdown */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5 text-xs">
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">Network</span>
          <span className="text-slate-800 font-bold">{network.name}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">Timestamp</span>
          <span className="text-slate-800 font-mono">
            {new Date(currentTx.timestamp).toLocaleString()}
          </span>
        </div>

        {currentTx.blockNumber && (
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Block Number</span>
            <span className="text-slate-800 font-mono">#{currentTx.blockNumber}</span>
          </div>
        )}

        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">From Address</span>
          <span className="font-mono text-slate-700">
            {currentTx.from.slice(0, 10)}...{currentTx.from.slice(-8)}
          </span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">To Address</span>
          <span className="font-mono text-slate-700">
            {currentTx.to.slice(0, 10)}...{currentTx.to.slice(-8)}
          </span>
        </div>

        {/* Transaction Hash */}
        <div className="pt-1">
          <span className="text-slate-500 block mb-1">Transaction Hash</span>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-cyan-700 truncate font-semibold">
              {currentTx.hash}
            </span>
            <button
              onClick={handleCopyHash}
              className="p-1 text-slate-500 hover:text-slate-900 transition-colors shrink-0"
              title="Copy Tx Hash"
            >
              {copiedHash ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      {currentTx.status === 'pending' && currentTx.from.toLowerCase() === activeAddress.toLowerCase() && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button onClick={() => setReplaceMode('speedup')} className="btn-primary !h-11 !rounded-2xl text-xs">Speed up</button>
          <button onClick={() => setReplaceMode('cancel')} className="btn-secondary !h-11 !rounded-2xl text-xs">Cancel transaction</button>
        </div>
      )}
      {currentTx.replacedBy && (
        <p className="text-[11px] text-slate-500 mb-3">Replaced by {currentTx.replacedBy.slice(0, 10)}…{currentTx.replacedBy.slice(-6)}</p>
      )}

      <PasscodeSheet
        open={replaceMode !== null}
        title={replaceMode === 'cancel' ? 'Cancel transaction' : 'Speed up transaction'}
        description={
          replaceMode === 'cancel'
            ? 'Sends a 0-value transaction to yourself with the same nonce and a higher fee. It only works if the original has not been mined yet.'
            : 'Re-sends the same transaction with a higher fee. It only works if the original has not been mined yet.'
        }
        confirmLabel={replaceMode === 'cancel' ? 'Cancel it' : 'Speed up'}
        onClose={() => setReplaceMode(null)}
        onUnlocked={async (key) => {
          try {
            const native = DEFAULT_TOKENS[currentTx.chainId]?.find((t) => t.address === 'native');
            const price = marketService.getPriceForToken(native?.coingeckoId || 'ethereum').priceUSD;
            const next = await TransactionService.replacePending(currentTx.chainId, key, currentTx.hash, replaceMode!, price);
            setCurrentTx(next);
            setSelectedTx(next);
            showToast(replaceMode === 'cancel' ? 'Cancellation sent' : 'Faster transaction sent', 'success');
            refreshBalances();
            setReplaceMode(null);
          } catch (err) {
            // surface to the sheet so the user can retry
            throw new Error(err instanceof Error ? err.message.split('\n')[0].slice(0, 160) : 'Could not replace the transaction.');
          }
        }}
      />

      {/* Explorer Action Button */}
      <div>
        <a
          href={`${network.blockExplorerUrl}/tx/${currentTx.hash}`}
          target="_blank"
          rel="noreferrer"
          className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <span>View on {network.shortName} Explorer</span>
          <ExternalLink size={15} />
        </a>
      </div>
    </div>
  );
};
