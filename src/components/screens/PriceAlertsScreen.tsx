import React, { useMemo, useState } from 'react';
import { Trash2, Bell } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { marketService } from '../../services/market/coingecko';
import { notificationsSupported, requestNotificationPermission } from '../../utils/notify';
import { ScreenShell } from '../common/ScreenShell';

export const PriceAlertsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { tokens, marketTokens, priceAlerts, addPriceAlert, removePriceAlert, settings, updateSettings, showToast } = useWallet();

  const assets = useMemo(() => {
    const map = new Map<string, { id: string; symbol: string; name: string }>();
    tokens.forEach((t) => t.coingeckoId && map.set(t.coingeckoId, { id: t.coingeckoId, symbol: t.symbol, name: t.name }));
    marketTokens.forEach((m) => map.set(m.id, { id: m.id, symbol: m.symbol.toUpperCase(), name: m.name }));
    return Array.from(map.values());
  }, [tokens, marketTokens]);

  const [assetId, setAssetId] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [target, setTarget] = useState('');
  const selected = assets.find((a) => a.id === (assetId || assets[0]?.id));
  const current = selected ? marketService.getPriceForToken(selected.id).priceUSD : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = parseFloat(target);
    if (!selected || !isFinite(t) || t <= 0) return showToast('Enter a target price above 0', 'error');
    addPriceAlert({ assetId: selected.id, symbol: selected.symbol, direction, target: t });
    setTarget('');
    if (!settings.notificationsEnabled && notificationsSupported()) {
      const perm = await requestNotificationPermission();
      if (perm === 'granted') updateSettings({ notificationsEnabled: true });
    }
    showToast('Alert added', 'success');
  };

  return (
    <ScreenShell title="Price Alerts" onBack={onBack}>
      <p className="text-xs text-muted mb-4">
        Alerts are checked while the wallet is open (on each refresh). Browsers can't run them in the background without a push server.
      </p>

      <form onSubmit={submit} className="p-4 rounded-3xl bg-card space-y-3 mb-5">
        <select value={assetId || assets[0]?.id || ''} onChange={(e) => setAssetId(e.target.value)} aria-label="Asset" className="w-full px-3 py-2.5 rounded-xl bg-white text-sm text-ink">
          {assets.map((a) => (
            <option key={a.id} value={a.id}>{a.name} ({a.symbol})</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <select value={direction} onChange={(e) => setDirection(e.target.value as 'above' | 'below')} aria-label="Direction" className="px-3 py-2.5 rounded-xl bg-white text-sm text-ink">
            <option value="above">Goes above</option>
            <option value="below">Drops below</option>
          </select>
          <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="USD price" aria-label="Target price in USD" className="px-3 py-2.5 rounded-xl bg-white text-sm text-ink" />
        </div>
        {current > 0 && <p className="text-[11px] text-muted">Current price: ${current.toLocaleString('en-US', { maximumFractionDigits: 4 })}</p>}
        <button type="submit" className="btn-primary !h-11 !rounded-2xl w-full">Add alert</button>
      </form>

      {priceAlerts.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted">No alerts yet.</div>
      ) : (
        <ul className="space-y-2.5">
          {priceAlerts.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-3xl bg-card">
              <Bell size={16} className={a.triggeredAt ? 'text-muted' : 'text-coral'} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] text-ink">{a.symbol} {a.direction === 'above' ? '≥' : '≤'} ${a.target.toLocaleString('en-US')}</div>
                <div className="text-xs text-muted">{a.triggeredAt ? `Triggered ${new Date(a.triggeredAt).toLocaleString()}` : 'Watching'}</div>
              </div>
              <button aria-label="Delete alert" onClick={() => removePriceAlert(a.id)} className="p-2 text-muted hover:text-rose-600"><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      )}
    </ScreenShell>
  );
};
