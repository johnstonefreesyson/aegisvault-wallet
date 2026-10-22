import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { fetchNfts, indexerAvailable, indexerConfigured, NftItem } from '../../services/blockchain/indexerService';
import { ScreenShell } from '../common/ScreenShell';

export const NftScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { activeAddress, activeChainId, activeNetwork } = useWallet();
  const [items, setItems] = useState<NftItem[]>([]);
  const [pageKey, setPageKey] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const available = indexerAvailable(activeChainId);

  const load = useCallback(
    async (more = false) => {
      if (!available) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetchNfts(activeChainId, activeAddress, more ? pageKey : undefined);
        setItems((prev) => (more ? [...prev, ...res.nfts] : res.nfts));
        setPageKey(res.pageKey);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load NFTs.');
      } finally {
        setLoading(false);
      }
    },
    [available, activeChainId, activeAddress, pageKey]
  );

  useEffect(() => {
    setItems([]);
    setPageKey(undefined);
    if (available) load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChainId, activeAddress, available]);

  return (
    <ScreenShell title={`NFTs · ${activeNetwork.shortName}`} onBack={onBack}>
      {!available ? (
        <div className="p-5 rounded-3xl bg-card text-sm text-ink/80 space-y-2">
          {indexerConfigured() ? (
            <p>NFT lookup isn't available on {activeNetwork.name}.</p>
          ) : (
            <>
              <p>NFT lookup needs an indexer. Add an Alchemy API key to <code className="font-mono text-xs">.env</code> as <code className="font-mono text-xs">VITE_ALCHEMY_KEY</code> and restart the dev server.</p>
              <p className="text-xs text-muted">Restrict the key to your domain in the Alchemy dashboard, since browser keys are public.</p>
            </>
          )}
        </div>
      ) : (
        <>
          {error && <p role="alert" className="text-xs text-rose-600 mb-3">{error}</p>}
          {!loading && items.length === 0 && !error && <div className="py-16 text-center text-sm text-muted">No NFTs found on this network.</div>}
          <ul className="grid grid-cols-2 gap-3">
            {items.map((n) => (
              <li key={`${n.contract}:${n.tokenId}`} className="rounded-3xl bg-card overflow-hidden">
                {n.image ? (
                  <img src={n.image} alt={n.name} loading="lazy" referrerPolicy="no-referrer" className="w-full aspect-square object-cover bg-white" />
                ) : (
                  <div className="w-full aspect-square bg-white flex items-center justify-center text-xs text-muted">No image</div>
                )}
                <div className="p-3">
                  <div className="text-sm text-ink truncate">{n.name}</div>
                  <div className="text-[11px] text-muted truncate">{n.collection}{n.balance !== '1' ? ` · ×${n.balance}` : ''}</div>
                  <a
                    href={`${activeNetwork.blockExplorerUrl}/token/${n.contract}?a=${n.tokenId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink"
                  >
                    Explorer <ExternalLink size={11} />
                  </a>
                </div>
              </li>
            ))}
          </ul>
          {loading && <div className="py-6 text-center text-sm text-muted">Loading…</div>}
          {pageKey && !loading && (
            <button onClick={() => load(true)} className="btn-secondary !h-11 !rounded-2xl w-full mt-4">Load more</button>
          )}
          <p className="text-[11px] text-muted mt-4">Viewing only. Sending NFTs isn't supported yet.</p>
        </>
      )}
    </ScreenShell>
  );
};
