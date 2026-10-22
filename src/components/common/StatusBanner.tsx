import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';

/** Shows an offline notice, or a retry prompt when some data failed to load. */
export const StatusBanner: React.FC = () => {
  const { isOnline, loadError, refreshBalances, isLoadingBalances } = useWallet();
  if (isOnline && !loadError) return null;

  return (
    <div
      role="status"
      className={`mx-4 mt-1 mb-2 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 ${
        !isOnline ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-800'
      }`}
    >
      {!isOnline ? <WifiOff size={14} className="shrink-0" /> : <AlertTriangle size={14} className="shrink-0" />}
      <span className="flex-1">
        {!isOnline ? "You're offline. Showing the last data we have." : "Some balances or prices couldn't be refreshed. Showing the last known values."}
      </span>
      {isOnline && (
        <button onClick={() => refreshBalances()} disabled={isLoadingBalances} className="font-semibold underline disabled:opacity-50">
          {isLoadingBalances ? 'Retrying…' : 'Retry'}
        </button>
      )}
    </div>
  );
};
