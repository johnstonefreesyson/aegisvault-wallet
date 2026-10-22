import React, { useState } from 'react';
import {
  ArrowLeft,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Cpu,
  Layers,
  FileCode,
  Zap,
} from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { riskScanner, SecurityScanResult } from '../../services/security/riskScanner';
import { txSimulator, SimulationResult } from '../../services/security/txSimulator';

export const SecurityScannerScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { activeAddress, vault, showToast } = useWallet();
  const [addressInput, setAddressInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<SecurityScanResult | null>(null);

  // Simulation test state
  const [simCalldata, setSimCalldata] = useState('0x095ea7b300000000000000000000000068b3465833fb72a70ecdf485e0e4c7bd8665fc45ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  const handleScan = async (targetToScan?: string) => {
    const target = targetToScan || addressInput;
    if (!target.trim()) {
      showToast('Please enter an address or contract to scan', 'error');
      return;
    }

    setIsScanning(true);
    try {
      const res = await riskScanner.scanAddress(target.trim(), [activeAddress]);
      setScanResult(res);
      showToast('Security audit complete', 'info');
    } catch {
      showToast('Scan failed', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSimulate = () => {
    const res = txSimulator.simulateTransaction({
      to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      from: activeAddress,
      value: '0.1',
      data: simCalldata,
    });
    setSimResult(res);
    showToast('Transaction simulated successfully', 'info');
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
          <h1 className="text-base font-bold text-ink">Security Shield</h1>
          <p className="text-[11px] text-muted">Risk Scanner & Pre-Signing Simulation</p>
        </div>
        <div className="w-8" />
      </div>

      <div className="space-y-6 max-w-lg mx-auto w-full">
        {/* Wallet Security Health Card */}
        <div className="p-5 rounded-3xl bg-card border border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-500" />
              Device Security Posture
            </span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              OPTIMIZED
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50">
              <span className="text-muted">KDF Iterations:</span>
              <span className="font-mono font-bold text-ink">
                {vault?.kdfIterations ? vault.kdfIterations.toLocaleString() : '600,000'} (OWASP)
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50">
              <span className="text-muted">Unlock Brute-Force Throttle:</span>
              <span className="text-emerald-600 font-bold">Active (Exponential Backoff)</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50">
              <span className="text-muted">Content Security Policy (CSP):</span>
              <span className="text-emerald-600 font-bold">Strict (Self-Contained)</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50">
              <span className="text-muted">Phrase Encryption:</span>
              <span className="font-mono text-ink">AES-GCM 256-bit (Unique Salt/IV)</span>
            </div>
          </div>
        </div>

        {/* Address & Token Scanner */}
        <div className="p-5 rounded-3xl bg-card border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-ink mb-1 flex items-center gap-1.5">
              <Search size={15} className="text-coral" />
              Contract & Recipient Risk Scanner
            </h3>
            <p className="text-[11px] text-muted">
              Detects address poisoning lookalikes, honeypots, prohibitive sell taxes, and unverified contracts before sending funds.
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Paste address or contract (0x…)"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-ink placeholder-slate-400 focus:outline-none focus:border-coral pr-20"
            />
            <button
              onClick={() => handleScan()}
              disabled={isScanning}
              className="absolute right-2 top-2 px-3 py-1.5 rounded-xl bg-peach text-ink font-bold text-xs hover:bg-peach-hover transition-colors"
            >
              {isScanning ? 'Scanning…' : 'Scan'}
            </button>
          </div>

          {/* Quick test buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="text-muted">Quick test:</span>
            <button
              onClick={() => {
                setAddressInput('0xdAC17F958D2ee523a2206206994597C13D831ec7');
                handleScan('0xdAC17F958D2ee523a2206206994597C13D831ec7');
              }}
              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Verified (USDT)
            </button>
            <button
              onClick={() => {
                setAddressInput('0x133700000000000000000000000000000000dead');
                handleScan('0x133700000000000000000000000000000000dead');
              }}
              className="px-2 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold"
            >
              Honeypot Scam
            </button>
          </div>

          {/* Scan Result */}
          {scanResult && (
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                scanResult.level === 'SAFE'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : scanResult.level === 'CAUTION'
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-rose-50/70 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {scanResult.level === 'SAFE' ? (
                    <ShieldCheck size={20} className="text-emerald-600" />
                  ) : (
                    <ShieldAlert size={20} className="text-rose-600" />
                  )}
                  <span className="text-xs font-bold text-ink">
                    Verdict: {scanResult.level} ({scanResult.score}/100)
                  </span>
                </div>
                {scanResult.isHoneypot && (
                  <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-md">
                    HONEYPOT
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {scanResult.flags.map((flag) => (
                  <div key={flag.id} className="text-xs">
                    <span className="font-bold text-ink block">{flag.title}</span>
                    <span className="text-[11px] text-slate-600 leading-relaxed block">
                      {flag.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Transaction Simulator */}
        <div className="p-5 rounded-3xl bg-card border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-ink mb-1 flex items-center gap-1.5">
              <Zap size={15} className="text-sky" />
              Pre-Signing Transaction Simulator
            </h3>
            <p className="text-[11px] text-muted">
              Simulates state and balance changes before signing, intercepting infinite allowance drainers.
            </p>
          </div>

          <button
            onClick={handleSimulate}
            className="btn-secondary w-full h-10 text-xs font-bold"
          >
            Simulate Sample DEX Approval
          </button>

          {simResult && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">{simResult.summary}</span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-md font-bold ${
                    simResult.verdict === 'SAFE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {simResult.verdict}
                </span>
              </div>

              {simResult.warnings.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] space-y-1">
                  {simResult.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <AlertTriangle size={13} className="shrink-0 text-amber-600 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {simResult.assetDeltas.length > 0 && (
                <div>
                  <span className="text-[10px] text-muted uppercase font-bold block mb-1">
                    Expected Asset Changes:
                  </span>
                  <div className="space-y-1">
                    {simResult.assetDeltas.map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-xs font-mono">
                        <span className={d.type === 'incoming' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                          {d.type === 'incoming' ? '+' : '-'} {d.amount} {d.assetSymbol}
                        </span>
                        <span className="text-muted">(${d.usdValue.toLocaleString()})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
