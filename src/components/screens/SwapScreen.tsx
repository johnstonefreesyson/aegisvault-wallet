import React, { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { ArrowDownUp, AlertTriangle } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { DEFAULT_TOKENS } from '../../config/networks';
import { secureStorage } from '../../services/storage/secureStorage';
import { marketService } from '../../services/market/coingecko';
import { SwapQuote, SwapService, swapSupported } from '../../services/blockchain/swapService';
import { TokenMetadata } from '../../types';
import { PasscodeSheet } from '../common/PasscodeSheet';
import { ScreenShell } from '../common/ScreenShell';

const SLIPPAGE = [50, 100, 300]; // basis points

export const SwapScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { tokens, activeChainId, activeAddress, activeNetwork, refreshBalances, showToast } = useWallet();

  const options: TokenMetadata[] = useMemo(() => {
    const list = [...(DEFAULT_TOKENS[activeChainId] || []), ...secureStorage.getCustomTokens().filter((t) => t.chainId === activeChainId)];
    return list;
  }, [activeChainId]);

  const [fromAddr, setFromAddr] = useState('native');
  const [toAddr, setToAddr] = useState('');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(100);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState('');
  const [ack, setAck] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [step, setStep] = useState<'' | 'approving' | 'swapping'>('');

  const from = options.find((t) => t.address === fromAddr) || options[0];
  const to = options.find((t) => t.address === (toAddr || options.find((t2) => t2.address !== from?.address)?.address));
  const fromBal = tokens.find((t) => t.address === from?.address);

  const parsedAmount = useMemo(() => {
    try {
      return from && amount && parseFloat(amount) > 0 ? ethers.parseUnits(amount, from.decimals) : null;
    } catch {
      return null;
    }
  }, [amount, from]);

  // Debounced quote
  useEffect(() => {
    setQuote(null);
    setError('');
    setAck(false);
    if (!from || !to || !parsedAmount || !swapSupported(activeChainId) || from.address === to.address) return;
    let cancelled = false;
    setQuoting(true);
    const t = setTimeout(async () => {
      try {
        const q = await SwapService.getQuote(activeChainId, from, to, parsedAmount, activeAddress, slippage);
        if (!cancelled) setQuote(q);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not get a quote.');
      } finally {
        if (!cancelled) setQuoting(false);
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [from, to, parsedAmount, slippage, activeChainId, activeAddress]);

  const insufficient = !!(parsedAmount && fromBal && parseFloat(amount) > parseFloat(fromBal.balance));
  const highImpact = !!quote && quote.impactPct !== null && quote.impactPct > 5;
  const fmtOut = (v: bigint) => (to ? parseFloat(ethers.formatUnits(v, to.decimals)).toLocaleString('en-US', { maximumFractionDigits: 6 }) : '');

  const flip = () => {
    if (!from || !to) return;
    setFromAddr(to.address);
    setToAddr(from.address);
    setAmount('');
  };

  const setMax = () => {
    if (!fromBal) return;
    const bal = parseFloat(fromBal.balance);
    setAmount(from.address === 'native' ? Math.max(0, bal - 0.005).toFixed(6) : fromBal.balance);
  };

  if (!swapSupported(activeChainId)) {
    return (
      <ScreenShell title="Swap" onBack={onBack}>
        <div className="p-5 rounded-3xl bg-card text-sm text-ink/80">Swaps aren't available on {activeNetwork.name}. Switch to Ethereum, BNB Chain, Polygon, Arbitrum, Optimism, Base or Avalanche.</div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title={`Swap · ${activeNetwork.shortName}`} onBack={onBack}>
      <div className="space-y-3">
        <div className="p-4 rounded-3xl bg-card space-y-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>You pay</span>
            <button onClick={setMax} className="underline">Max</button>
          </div>
          <div className="flex gap-2">
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.0"
              aria-label="Amount to swap"
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-white text-lg text-ink tabular-nums focus:outline-none"
            />
            <select value={from?.address} onChange={(e) => { setFromAddr(e.target.value); setQuote(null); }} aria-label="Pay with" className="px-3 rounded-xl bg-white text-sm text-ink">
              {options.map((t) => <option key={t.address} value={t.address}>{t.symbol}</option>)}
            </select>
          </div>
          {fromBal && <div className="text-[11px] text-muted">Balance: {parseFloat(fromBal.balance).toLocaleString('en-US', { maximumFractionDigits: 6 })} {from.symbol}</div>}
        </div>

        <div className="flex justify-center -my-1">
          <button onClick={flip} aria-label="Swap direction" className="p-2 rounded-full bg-card text-ink/70 hover:text-ink"><ArrowDownUp size={16} /></button>
        </div>

        <div className="p-4 rounded-3xl bg-card space-y-2">
          <div className="text-xs text-muted">You receive (estimated)</div>
          <div className="flex gap-2">
            <div className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-white text-lg text-ink tabular-nums">
              {quoting ? '…' : quote ? fmtOut(quote.destAmount) : '0.0'}
            </div>
            <select value={to?.address} onChange={(e) => setToAddr(e.target.value)} aria-label="Receive" className="px-3 rounded-xl bg-white text-sm text-ink">
              {options.filter((t) => t.address !== from?.address).map((t) => <option key={t.address} value={t.address}>{t.symbol}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Max slippage</span>
          {SLIPPAGE.map((s) => (
            <button key={s} onClick={() => setSlippage(s)} className={`px-2.5 py-1 rounded-full ${slippage === s ? 'bg-peach text-ink' : 'bg-card'}`}>{s / 100}%</button>
          ))}
        </div>

        {quote && to && (
          <div className="p-3.5 rounded-2xl bg-card text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-muted">Minimum received</span><span className="text-ink tabular-nums">{fmtOut(quote.minDestAmount)} {to.symbol}</span></div>
            <div className="flex justify-between"><span className="text-muted">Est. network fee</span><span className="text-ink tabular-nums">~${quote.gasCostUSD.toFixed(2)}</span></div>
            {quote.impactPct !== null && <div className="flex justify-between"><span className="text-muted">Value difference</span><span className={`tabular-nums ${highImpact ? 'text-rose-600' : 'text-ink'}`}>-{quote.impactPct.toFixed(2)}%</span></div>}
            {from.address !== 'native' && <div className="text-muted">The first swap of a token needs a one-time approval for exactly this amount.</div>}
          </div>
        )}

        {highImpact && (
          <label className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs cursor-pointer">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>You'd receive about {quote!.impactPct!.toFixed(1)}% less than the market value. <input type="checkbox" className="ml-1" checked={ack} onChange={(e) => setAck(e.target.checked)} /> I understand</span>
          </label>
        )}
        {insufficient && <p role="alert" className="text-xs text-rose-600">Insufficient {from.symbol} balance.</p>}
        {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}

        <button
          onClick={() => setSheet(true)}
          disabled={!quote || insufficient || (highImpact && !ack) || !!step}
          className="btn-primary !h-12 !rounded-2xl w-full disabled:opacity-50"
        >
          {step === 'approving' ? 'Approving…' : step === 'swapping' ? 'Swapping…' : quoting ? 'Getting quote…' : 'Swap'}
        </button>
        <p className="text-[11px] text-muted">Quotes by Velora (ParaSwap). Your keys never leave this device; the swap transaction is checked against the quote before it is signed.</p>
      </div>

      <PasscodeSheet
        open={sheet}
        title="Confirm swap"
        description={quote && from && to ? `Swap ${amount} ${from.symbol} for at least ${fmtOut(quote.minDestAmount)} ${to.symbol}.` : undefined}
        confirmLabel="Swap"
        onClose={() => setSheet(false)}
        onUnlocked={async (key) => {
          if (!quote || !from || !to) return;
          setSheet(false);
          try {
            const native = DEFAULT_TOKENS[activeChainId].find((t) => t.address === 'native');
            const price = marketService.getPriceForToken(native?.coingeckoId || 'ethereum').priceUSD;
            await SwapService.execute(activeChainId, key, from, to, quote, slippage, price, setStep);
            showToast('Swap submitted', 'success');
            setAmount('');
            setQuote(null);
            refreshBalances();
          } catch (e) {
            const m = (e as { shortMessage?: string; message?: string })?.shortMessage || (e as Error)?.message || 'Swap failed';
            setError(m.split('\n')[0].slice(0, 200));
          } finally {
            setStep('');
          }
        }}
      />
    </ScreenShell>
  );
};
