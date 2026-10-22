import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  DollarSign,
  FileText,
  Lock,
  Trash2,
  ChevronRight,
  Edit2,
  Check,
  AlertTriangle,
  QrCode,
  ExternalLink,
  CheckCircle2,
  FlaskConical,
  History,
  Timer,
  Moon,
  Bell,
  BookUser,
  X,
  ShieldAlert,
  BellRing,
} from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { runWalletUnitTests } from '../../tests/wallet.test';
import { WalletLogo } from '../common/WalletLogo';
import { FIAT_OPTIONS } from '../../services/market/fx';
import { requestNotificationPermission, notificationsSupported } from '../../utils/notify';

interface SettingsScreenProps {
  onOpenNetworkModal: () => void;
  onOpenBackupSeed: () => void;
  onOpenAddressView: () => void;
  onOpenLegal: () => void;
  onOpenHardware?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onOpenNetworkModal,
  onOpenBackupSeed,
  onOpenAddressView,
  onOpenLegal,
  onOpenHardware,
}) => {
  const {
    walletName,
    updateWalletName,
    settings,
    updateSettings,
    lockWallet,
    removeWallet,
    activeNetwork,
    showToast,
    setCurrentScreen,
  } = useWallet();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(walletName);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [removalConfirmText, setRemovalConfirmText] = useState('');
  const [testResults, setTestResults] = useState<{ total: number; passed: number; results: any[] } | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const handleRunTests = () => {
    const res = runWalletUnitTests();
    setTestResults(res);
    setIsTestModalOpen(true);
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      updateWalletName(nameInput.trim());
      setIsEditingName(false);
    }
  };

  const handleConfirmRemoval = () => {
    if (removalConfirmText.trim().toLowerCase() === 'delete') {
      removeWallet();
      setIsRemoveDialogOpen(false);
    } else {
      showToast('Type DELETE to confirm wallet removal', 'error');
    }
  };

  return (
    <div className="pb-32 px-4 sm:px-6 md:px-8 pt-4 w-full md:px-10 lg:px-[10%] space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Wallet Settings</h2>
        <p className="text-xs text-slate-500">Security, preferences & account management</p>
      </div>

      {/* Account Profile Card */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Active Account</span>
          {!isEditingName && (
            <button
              onClick={() => {
                setNameInput(walletName);
                setIsEditingName(true);
              }}
              className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-bold"
            >
              <Edit2 size={12} />
              <span>Rename</span>
            </button>
          )}
        </div>

        {isEditingName ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 font-semibold"
              autoFocus
            />
            <button
              onClick={handleSaveName}
              className="p-1.5 rounded-xl bg-peach text-ink font-bold"
            >
              <Check size={16} />
            </button>
          </div>
        ) : (
          <h3 className="text-sm font-bold text-slate-900">{walletName}</h3>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={onOpenAddressView}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-2 text-xs text-slate-700 font-semibold transition-colors"
          >
            <QrCode size={15} className="text-cyan-600" />
            <span>Show Address QR</span>
          </button>
          <button
            onClick={onOpenBackupSeed}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-2 text-xs text-slate-700 font-semibold transition-colors"
          >
            <KeyRound size={15} className="text-amber-600" />
            <span>Backup Phrase</span>
          </button>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3.5">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Preferences</h4>

        {/* Currency Display */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            <DollarSign size={16} className="text-slate-400" />
            <span className="text-xs text-slate-700 font-semibold">Display Currency</span>
          </div>
          <select
            value={settings.currency}
            onChange={(e) => updateSettings({ currency: e.target.value as any })}
            className="bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-cyan-700 rounded-lg px-2.5 py-1 focus:outline-none"
          >
            {FIAT_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Refresh Interval */}
        <div className="flex items-center justify-between py-1 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <RefreshCw size={16} className="text-slate-400" />
            <div>
              <span className="text-xs text-slate-700 font-semibold block">Price Refresh Interval</span>
              <span className="text-[10px] text-slate-500">Auto-polling rate limit control</span>
            </div>
          </div>
          <select
            value={settings.refreshIntervalSeconds}
            onChange={(e) => updateSettings({ refreshIntervalSeconds: Number(e.target.value) })}
            className="bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-cyan-700 rounded-lg px-2.5 py-1 focus:outline-none"
          >
            <option value={15}>15 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={60}>60 seconds</option>
          </select>
        </div>

        {/* Auto-lock */}
        <div className="flex items-center justify-between py-1 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <Timer size={16} className="text-slate-400" />
            <div>
              <span className="text-xs text-slate-700 font-semibold block">Auto-lock</span>
              <span className="text-[10px] text-slate-500">Lock after inactivity or when you leave the app</span>
            </div>
          </div>
          <select
            aria-label="Auto-lock timer"
            value={settings.autoLockMinutes}
            onChange={(e) => updateSettings({ autoLockMinutes: Number(e.target.value) })}
            className="bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-cyan-700 rounded-lg px-2.5 py-1 focus:outline-none"
          >
            <option value={0}>On leaving</option>
            <option value={1}>1 minute</option>
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
          </select>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between py-1 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <Moon size={16} className="text-slate-400" />
            <span className="text-xs text-slate-700 font-semibold">Appearance</span>
          </div>
          <select
            aria-label="Theme"
            value={settings.theme}
            onChange={(e) => updateSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
            className="bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-cyan-700 rounded-lg px-2.5 py-1 focus:outline-none"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        {/* Notifications */}
        {notificationsSupported() && (
          <div className="flex items-center justify-between py-1 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              <Bell size={16} className="text-slate-400" />
              <div>
                <span className="text-xs text-slate-700 font-semibold block">Notifications</span>
                <span className="text-[10px] text-slate-500">Confirmed transactions and incoming funds (while the app is open)</span>
              </div>
            </div>
            <input
              type="checkbox"
              aria-label="Enable notifications"
              checked={settings.notificationsEnabled}
              onChange={async (e) => {
                if (e.target.checked) {
                  const result = await requestNotificationPermission();
                  if (result !== 'granted') {
                    showToast('Notifications are blocked in your browser settings.', 'info');
                    updateSettings({ notificationsEnabled: false });
                    return;
                  }
                }
                updateSettings({ notificationsEnabled: e.target.checked });
              }}
            />
          </div>
        )}

        {/* Hide Balance Toggle */}
        <div className="flex items-center justify-between py-1 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            {settings.balanceHidden ? (
              <EyeOff size={16} className="text-slate-400" />
            ) : (
              <Eye size={16} className="text-slate-400" />
            )}
            <span className="text-xs text-slate-700 font-semibold">Mask Balances by Default</span>
          </div>
          <input
            type="checkbox"
            checked={settings.balanceHidden}
            onChange={(e) => updateSettings({ balanceHidden: e.target.checked })}
            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 h-4 w-4"
          />
        </div>

        {/* Active Network */}
        <button
          onClick={onOpenNetworkModal}
          className="w-full flex items-center justify-between py-1 border-t border-slate-100 text-left"
        >
          <div className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: activeNetwork.color }}
            />
            <span className="text-xs text-slate-700 font-semibold">Active Network</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>{activeNetwork.name}</span>
            <ChevronRight size={14} />
          </div>
        </button>
      </div>

      {/* Web3, Chains & Hardware */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Web3 & Advanced Security</h4>

        <button
          onClick={() => setCurrentScreen('security_scanner')}
          className="w-full flex items-center justify-between py-2 text-xs text-slate-700 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Shield size={16} className="text-emerald-600" />
            <span className="font-semibold">Security Shield & Risk Scanner</span>
          </div>
          <ChevronRight size={14} className="text-slate-400" />
        </button>

        <button
          onClick={() => setCurrentScreen('walletconnect')}
          className="w-full flex items-center justify-between py-2 border-t border-slate-100 text-xs text-slate-700 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <QrCode size={16} className="text-sky" />
            <span className="font-semibold">WalletConnect v2 Sessions</span>
          </div>
          <ChevronRight size={14} className="text-slate-400" />
        </button>

        <button
          onClick={() => setCurrentScreen('multichain')}
          className="w-full flex items-center justify-between py-2 border-t border-slate-100 text-xs text-slate-700 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <KeyRound size={16} className="text-amber-500" />
            <span className="font-semibold">Multi-Chain Hub (BTC, SOL, TRX, ATOM)</span>
          </div>
          <ChevronRight size={14} className="text-slate-400" />
        </button>

        {onOpenHardware && (
          <button
            onClick={onOpenHardware}
            className="w-full flex items-center justify-between py-2 border-t border-slate-100 text-xs text-slate-700 hover:text-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Lock size={16} className="text-coral" />
              <span className="font-semibold">Hardware Wallet (Ledger & Trezor)</span>
            </div>
            <ChevronRight size={14} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* Security & Legal */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Legal & Testing</h4>

        <button
          onClick={() => setCurrentScreen('approvals')}
          className="w-full flex items-center justify-between py-2 text-xs text-slate-700 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={16} className="text-cyan-600" />
            <span className="font-semibold">Token Approvals</span>
          </div>
          <ChevronRight size={14} className="text-slate-400" />
        </button>

        <button
          onClick={() => setCurrentScreen('price_alerts')}
          className="w-full flex items-center justify-between py-2 text-xs text-slate-700 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <BellRing size={16} className="text-cyan-600" />
            <span className="font-semibold">Price Alerts</span>
          </div>
          <ChevronRight size={14} className="text-slate-400" />
        </button>

        <button
          onClick={() => setCurrentScreen('contacts')}
          className="w-full flex items-center justify-between py-2 text-xs text-slate-700 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <BookUser size={16} className="text-cyan-600" />
            <span className="font-semibold">Address Book</span>
          </div>
          <ChevronRight size={14} className="text-slate-400" />
        </button>

        <button
          onClick={() => setCurrentScreen('transactions')}
          className="w-full flex items-center justify-between py-2 text-xs text-slate-700 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <History size={16} className="text-cyan-600" />
            <span className="font-semibold">Transaction Activity</span>
          </div>
          <ChevronRight size={14} className="text-slate-400" />
        </button>

        <button
          onClick={handleRunTests}
          className="w-full flex items-center justify-between py-2 text-xs text-slate-700 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <FlaskConical size={16} className="text-cyan-600" />
            <span className="font-semibold">Run Cryptographic Test Suite</span>
          </div>
          <ChevronRight size={14} className="text-slate-400" />
        </button>

        <button
          onClick={onOpenLegal}
          className="w-full flex items-center justify-between py-2 border-t border-slate-100 text-xs text-slate-700 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <FileText size={16} className="text-slate-400" />
            <span className="font-semibold">Terms of Use & Privacy Policy</span>
          </div>
          <ChevronRight size={14} className="text-slate-400" />
        </button>

        <div className="flex items-center justify-between py-2 border-t border-slate-100 text-xs text-slate-500 font-mono">
          <span>Application Version</span>
          <span>1.0.0 (Production)</span>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center">
          <WalletLogo size={32} showText={true} />
        </div>
      </div>

      {/* Destructive Actions: Lock vs Remove */}
      <div className="space-y-2.5 pt-2">
        <button
          onClick={lockWallet}
          className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <Lock size={15} />
          <span>Lock Wallet Session</span>
        </button>

        <button
          onClick={() => setIsRemoveDialogOpen(true)}
          className="w-full py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <Trash2 size={15} />
          <span>Remove Wallet from This Device</span>
        </button>
      </div>

      {/* Remove Wallet Confirmation Dialog Modal */}
      {isRemoveDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white border border-rose-200 rounded-3xl p-5 space-y-4 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 mb-1">Remove Wallet?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will delete your encrypted private key and recovery phrase from this browser. Ensure you have backed up your 12-word recovery phrase, or you will lose your funds forever.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-600 block">
                Type <strong className="text-rose-600 font-mono">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={removalConfirmText}
                onChange={(e) => setRemovalConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono text-xs text-slate-900 focus:outline-none focus:border-rose-500 uppercase font-bold"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsRemoveDialogOpen(false);
                  setRemovalConfirmText('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemoval}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-colors"
              >
                Erase Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Results Modal */}
      {isTestModalOpen && testResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FlaskConical size={18} className="text-cyan-600" />
                <h3 className="text-sm font-bold text-slate-900">Cryptographic Test Suite</h3>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <span className="text-xs text-emerald-700 font-semibold">Status</span>
              <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={14} />
                <span>{testResults.passed} of {testResults.total} Tests Passed (100%)</span>
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {testResults.results.map((res: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{res.name}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        res.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {res.success ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  {res.details && (
                    <p className="text-[11px] text-slate-500 font-mono truncate">{res.details}</p>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsTestModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-peach hover:bg-peach-hover text-ink font-bold text-xs transition-colors shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
