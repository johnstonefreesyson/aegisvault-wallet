import React, { useState } from 'react';
import {
  X,
  Usb,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import {
  hardwareWalletService,
  HardwareBrand,
  HardwareAccount,
} from '../../services/hardware/hardwareWalletService';

interface HardwareWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareWalletModal: React.FC<HardwareWalletModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useWallet();
  const [selectedBrand, setSelectedBrand] = useState<HardwareBrand>('ledger');
  const [step, setStep] = useState<'select' | 'connect' | 'accounts'>('select');
  const [isConnecting, setIsConnecting] = useState(false);
  const [accounts, setAccounts] = useState<HardwareAccount[]>([]);
  const [selectedAccountIdx, setSelectedAccountIdx] = useState(0);

  if (!isOpen) return null;

  const isSupported = hardwareWalletService.isWebUsbSupported() || hardwareWalletService.isWebHidSupported();

  const handleStartConnect = async () => {
    setIsConnecting(true);
    setStep('connect');

    setTimeout(async () => {
      try {
        await hardwareWalletService.connectDevice(selectedBrand);
        const derived = await hardwareWalletService.getAccounts(selectedBrand);
        setAccounts(derived);
        setStep('accounts');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not detect hardware wallet';
        showToast(msg, 'error');
        setStep('select');
      } finally {
        setIsConnecting(false);
      }
    }, 1500);
  };

  const handleImportAccount = () => {
    const acc = accounts[selectedAccountIdx];
    if (!acc) return;
    showToast(`Hardware account (${acc.brand.toUpperCase()}) imported successfully!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Usb size={18} className="text-coral" />
            <h3 className="text-base font-bold text-ink">Connect Hardware Wallet</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-ink rounded-xl"
          >
            <X size={18} />
          </button>
        </div>

        {/* Browser check notice */}
        {!isSupported && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
            <span>
              Your browser does not expose WebUSB or WebHID. Chrome, Brave, Edge, or Chromium-based browsers are recommended.
            </span>
          </div>
        )}

        {/* STEP 1: Select Brand */}
        {step === 'select' && (
          <div className="space-y-4">
            <p className="text-xs text-muted leading-relaxed">
              Keys remain permanently isolated inside your hardware security element. AegisVault only queries public keys and sends unsigned payloads for physical on-device approval.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { brand: 'ledger' as const, name: 'Ledger', desc: 'Nano S / X / Stax' },
                { brand: 'trezor' as const, name: 'Trezor', desc: 'Model T / Safe 3' },
              ].map((b) => (
                <div
                  key={b.brand}
                  onClick={() => setSelectedBrand(b.brand)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedBrand === b.brand
                      ? 'bg-peach/20 border-coral shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm font-bold text-ink block mb-0.5">{b.name}</span>
                  <span className="text-[10px] text-muted">{b.desc}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleStartConnect}
              disabled={isConnecting}
              className="btn-primary w-full h-11 text-xs font-bold uppercase tracking-wider"
            >
              <span>Connect via USB / HID</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: Device instructions & searching */}
        {step === 'connect' && (
          <div className="py-6 text-center space-y-4">
            <RefreshCw size={32} className="animate-spin mx-auto text-coral" />
            <div>
              <h4 className="text-sm font-bold text-ink mb-1">
                Connecting to {selectedBrand === 'ledger' ? 'Ledger' : 'Trezor'}…
              </h4>
              <p className="text-xs text-muted max-w-xs mx-auto">
                1. Unlock your device with your PIN.<br />
                2. Open the Ethereum / Multi-Chain App.<br />
                3. Allow WebUSB pairing in the browser prompt.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: Account selection */}
        {step === 'accounts' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-ink">Select Account to Import</h4>
              <p className="text-[11px] text-muted">Derived from your hardware security chip:</p>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {accounts.map((acc, idx) => (
                <div
                  key={acc.address}
                  onClick={() => setSelectedAccountIdx(idx)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedAccountIdx === idx
                      ? 'bg-peach/20 border-coral shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-ink block">
                      Account #{acc.index + 1} ({acc.brand.toUpperCase()})
                    </span>
                    <span className="text-[11px] font-mono text-slate-600 truncate max-w-[200px] block">
                      {acc.address}
                    </span>
                  </div>
                  {selectedAccountIdx === idx && (
                    <CheckCircle2 size={16} className="text-coral" />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleImportAccount}
              className="btn-primary w-full h-11 text-xs font-bold uppercase tracking-wider"
            >
              <span>Import Hardware Account</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
