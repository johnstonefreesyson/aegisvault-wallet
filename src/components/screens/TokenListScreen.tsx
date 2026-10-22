import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search, Plus, Trash2, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { TokenIcon } from '../common/TokenIcon';
import { TokenBalance } from '../../types';
import { DiscoveredToken, discoverTokens, indexerAvailable } from '../../services/blockchain/indexerService';

interface TokenListScreenProps {
  onOpenAddCustomToken: () => void;
  onClose: () => void;
}

export const TokenListScreen: React.FC<TokenListScreenProps> = ({
  onOpenAddCustomToken,
  onClose,
}) => {
  const {
    tokens,
    activeNetwork,
    setSelectedToken,
    setCurrentScreen,
    removeCustomToken,
    settings,
    hiddenTokenKeys,
    tokenKey,
    toggleTokenHidden,
    activeAddress,
    activeChainId,
    addCustomToken,
  } = useWallet();

  const [search, setSearch] = useState('');
  const [found, setFound] = useState<DiscoveredToken[]>([]);
  const [scanning, setScanning] = useState(false);
  const [showSpam, setShowSpam] = useState(false);
  const canDiscover = indexerAvailable(activeChainId);

  useEffect(() => {
    let cancelled = false;
    setFound([]);
    if (!canDiscover || !activeAddress) return;
    setScanning(true);
    discoverTokens(activeChainId, activeAddress, tokens.map((t) => t.address))
      .then((r) => !cancelled && setFound(r))
      .catch(() => undefined)
      .finally(() => !cancelled && setScanning(false));
    return () => {
      cancelled = true;
    };
    // tokens identity changes on every refresh; only rescan when the account/chain changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChainId, activeAddress, canDiscover]);

  const visibleFound = found.filter((f) => showSpam || !f.likelySpam);
  const spamCount = found.filter((f) => f.likelySpam).length;

  const filtered = tokens.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (token: TokenBalance) => {
    setSelectedToken(token);
    setCurrentScreen('token_details');
  };

  return (
    <div className="fixed inset-0 z-50 page-wash flex flex-col justify-between p-4 md:px-10 lg:px-[10%] overflow-y-auto">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Manage Assets ({activeNetwork.shortName})
          </span>
          <button
            onClick={onOpenAddCustomToken}
            className="p-2 -mr-2 rounded-xl text-cyan-600 hover:text-cyan-700 hover:bg-slate-100 transition-colors"
            title="Add Custom Token"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tokens on this chain..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-xs"
          />
        </div>

        {(scanning || found.length > 0) && (
          <div className="mb-4 p-3 rounded-2xl bg-card">
            <div className="text-xs text-ink/80 mb-2">{scanning ? 'Looking for tokens in your wallet…' : 'Found in your wallet'}</div>
            <ul className="space-y-2">
              {visibleFound.map((f) => (
                <li key={f.address} className="flex items-center gap-3">
                  <TokenIcon symbol={f.symbol} address={f.address} chainId={f.chainId} size={30} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-ink truncate">{f.name} ({f.symbol})</div>
                    <div className="text-[11px] text-muted font-mono">{parseFloat(f.balance).toLocaleString('en-US', { maximumFractionDigits: 4 })}{f.likelySpam ? ' · likely spam' : ''}</div>
                  </div>
                  <button
                    onClick={() => {
                      const { balance: _b, likelySpam: _s, ...meta } = f;
                      addCustomToken(meta);
                      setFound((prev) => prev.filter((x) => x.address !== f.address));
                    }}
                    className="px-3 py-1.5 rounded-full bg-peach text-ink text-xs font-semibold"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
            {spamCount > 0 && (
              <button onClick={() => setShowSpam((v) => !v)} className="mt-2 text-[11px] text-muted underline">
                {showSpam ? 'Hide' : 'Show'} {spamCount} likely spam token{spamCount > 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}
        {!canDiscover && (
          <p className="mb-3 text-[11px] text-muted">Auto-discovery of tokens needs an indexer key (VITE_ALCHEMY_KEY). Until then, add tokens by address.</p>
        )}

        {/* Token rows */}
        <div className="space-y-2">
          {filtered.map((token) => (
            <div
              key={`${token.chainId}-${token.address}`}
              className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs flex items-center justify-between gap-3"
            >
              <button
                onClick={() => handleSelect(token)}
                className="flex items-center gap-3 flex-1 text-left min-w-0"
              >
                <TokenIcon
                  symbol={token.symbol}
                  address={token.address}
                  chainId={token.chainId}
                  size={36}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">{token.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({token.symbol})</span>
                    {token.isCustom && (
                      <span className="text-[10px] text-amber-600 font-mono font-medium">Custom</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono block">
                    Balance: {parseFloat(token.balance).toFixed(4)} · ${token.priceUSD.toFixed(2)}
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleTokenHidden(token)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                  title={hiddenTokenKeys.includes(tokenKey(token)) ? 'Show on Home' : 'Hide from Home'}
                  aria-label={hiddenTokenKeys.includes(tokenKey(token)) ? `Show ${token.symbol} on Home` : `Hide ${token.symbol} from Home`}
                  aria-pressed={hiddenTokenKeys.includes(tokenKey(token))}
                >
                  {hiddenTokenKeys.includes(tokenKey(token)) ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                {token.isCustom && (
                  <button
                    onClick={() => removeCustomToken(token.address)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="Remove custom token"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button
                  onClick={() => handleSelect(token)}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 pb-2">
        <button
          onClick={onOpenAddCustomToken}
          className="w-full py-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus size={16} />
          <span>Import Custom Token by Address</span>
        </button>
      </div>
    </div>
  );
};
