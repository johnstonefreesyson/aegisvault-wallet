import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Clipboard,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Lock,
  QrCode,
  BookUser,
  AlertTriangle,
} from 'lucide-react';
import { ethers } from 'ethers';
import { useWallet } from '../../store/WalletContext';
import { TokenIcon } from '../common/TokenIcon';
import { TokenBalance, GasFeeEstimate } from '../../types';
import { TransactionService, GAS_SPEED_MULTIPLIERS, parseCustomFee } from '../../services/blockchain/transactionService';
import { rpcService } from '../../services/blockchain/rpcProvider';
import { checkRecipient, SafetyFinding } from '../../utils/addressSafety';
import { haptic } from '../../utils/notify';
import { GasSpeed, CustomFee } from '../../types';
import { WalletManager } from '../../services/blockchain/walletManager';
import { SUPPORTED_NETWORKS } from '../../config/networks';

interface SendScreenProps {
  initialToken?: TokenBalance | null;
  onClose: () => void;
}

export const SendScreen: React.FC<SendScreenProps> = ({ initialToken, onClose }) => {
  const {
    tokens,
    activeChainId,
    activeNetwork,
    activeAddress,
    activeVault,
    showToast,
    refreshBalances,
    accounts,
    activeAccount,
    contacts,
    saveContact,
    transactions,
    settings,
    fiat,
    updateSettings,
  } = useWallet();

  const [selectedToken, setSelectedToken] = useState<TokenBalance>(() => {
    return initialToken || tokens[0] || {
      address: 'native',
      chainId: activeChainId,
      symbol: activeNetwork.nativeCurrency.symbol,
      name: activeNetwork.nativeCurrency.name,
      decimals: 18,
      balance: '0.0',
      balanceRaw: '0',
      fiatValueUSD: 0,
      priceUSD: 0,
      priceChange24h: 0,
    };
  });

  // `recipientInput` is what the user typed (address or ENS name); `toAddress` is the resolved 0x address.
  const [recipientInput, setRecipientInput] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [ensStatus, setEnsStatus] = useState<'idle' | 'resolving' | 'ok' | 'fail'>('idle');
  const [recipientIsContract, setRecipientIsContract] = useState<boolean | undefined>(undefined);
  const [showBook, setShowBook] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [speed, setSpeed] = useState<GasSpeed>(settings.gasSpeed || 'normal');
  const [useCustomFee, setUseCustomFee] = useState(false);
  const [customFee, setCustomFee] = useState<CustomFee>({ maxFeeGwei: '', priorityGwei: '' });
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSkipped, setSimSkipped] = useState(false);
  const activeCustom = useCustomFee && parseCustomFee(customFee) ? customFee : null;
  const [amount, setAmount] = useState('');
  const [isTokenPickerOpen, setIsTokenPickerOpen] = useState(false);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<GasFeeEstimate | null>(null);

  // Flow steps: 'input' -> 'summary' -> 'passcode' -> 'broadcasting' -> 'success' | 'failed'
  const [flowStep, setFlowStep] = useState<'input' | 'summary' | 'passcode' | 'broadcasting' | 'success' | 'failed'>('input');
  const [passcode, setPasscode] = useState('');
  const [broadcastTxHash, setBroadcastTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Native coin price for gas USD calculation
  const nativeToken = tokens.find((t) => t.address === 'native');
  const nativePriceUSD = nativeToken?.priceUSD || 0;

  // Resolve typed input: plain address, or an ENS name (resolved on Ethereum mainnet)
  useEffect(() => {
    const raw = recipientInput.trim();
    setAcknowledged(false);
    if (!raw) {
      setToAddress('');
      setEnsStatus('idle');
      return;
    }
    if (ethers.isAddress(raw)) {
      setToAddress(raw);
      setEnsStatus('idle');
      return;
    }
    if (/^[^\s]+\.[a-z]{2,}$/i.test(raw)) {
      let cancelled = false;
      setEnsStatus('resolving');
      setToAddress('');
      const t = setTimeout(async () => {
        try {
          const resolved = await rpcService.getProvider(1).resolveName(raw);
          if (cancelled) return;
          if (resolved && ethers.isAddress(resolved)) {
            setToAddress(resolved);
            setEnsStatus('ok');
          } else {
            setEnsStatus('fail');
          }
        } catch {
          if (!cancelled) setEnsStatus('fail');
        }
      }, 500);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }
    setToAddress('');
    setEnsStatus('idle');
  }, [recipientInput]);

  // Is the recipient a smart contract on this chain?
  useEffect(() => {
    setRecipientIsContract(undefined);
    if (!ethers.isAddress(toAddress)) return;
    let cancelled = false;
    rpcService
      .getProvider(activeChainId)
      .getCode(toAddress)
      .then((code) => !cancelled && setRecipientIsContract(code !== '0x'))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [toAddress, activeChainId]);

  const findings: SafetyFinding[] = useMemo(
    () =>
      toAddress
        ? checkRecipient({
            toAddress,
            ownAddresses: accounts.map((a) => a.address),
            tokenContracts: tokens.filter((t) => t.address !== 'native').map((t) => t.address),
            contacts,
            transactions,
            recipientIsContract,
          })
        : [],
    [toAddress, accounts, tokens, contacts, transactions, recipientIsContract]
  );
  const blocked = findings.some((f) => f.level === 'block');
  const warnings = findings.filter((f) => f.level === 'warn');
  const recentRecipients = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of transactions) {
      if (t.type !== 'send') continue;
      const k = t.to.toLowerCase();
      if (!seen.has(k) && !contacts.some((c) => c.address.toLowerCase() === k)) {
        seen.add(k);
        out.push(t.to);
      }
      if (out.length >= 4) break;
    }
    return out;
  }, [transactions, contacts]);

  // Real Gas Estimation when amount or recipient changes
  useEffect(() => {
    let isCancelled = false;
    async function estimate() {
      if (!ethers.isAddress(toAddress) || !activeAddress) {
        setGasEstimate(null);
        return;
      }
      setIsEstimatingGas(true);
      try {
        const est = await TransactionService.estimateGasFee(
          activeChainId,
          activeAddress,
          toAddress,
          amount || '0.001',
          selectedToken.address,
          selectedToken.decimals,
          nativePriceUSD,
          speed,
          activeCustom
        );
        if (!isCancelled) {
          setGasEstimate(est);
        }
      } catch {
        if (!isCancelled) {
          // Fallback conservative estimation
          setGasEstimate({
            gasLimit: '21000',
            estimatedFeeNative: '0.00045',
            estimatedFeeUSD: 0.00045 * nativePriceUSD,
          });
        }
      } finally {
        if (!isCancelled) setIsEstimatingGas(false);
      }
    }
    estimate();
    return () => {
      isCancelled = true;
    };
  }, [toAddress, amount, selectedToken, activeChainId, activeAddress, nativePriceUSD, speed, useCustomFee, customFee.maxFeeGwei, customFee.priorityGwei]);

  const handlePasteAddress = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRecipientInput(text.trim());
      }
    } catch {
      showToast('Clipboard access unavailable. Please paste directly.', 'info');
    }
  };

  const handleSetMax = () => {
    const isNative = selectedToken.address === 'native';
    const feeNative = gasEstimate?.estimatedFeeNative || '0.0005';
    const maxVal = TransactionService.calculateMaxAmount(
      selectedToken.balance,
      isNative,
      feeNative
    );
    setAmount(maxVal);
  };

  const handleProceedToSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!ethers.isAddress(toAddress)) {
      setErrorMessage('Please enter a valid address or ENS name.');
      return;
    }

    const block = findings.find((f) => f.level === 'block');
    if (block) {
      setErrorMessage(block.message);
      return;
    }

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setErrorMessage('Please specify an amount greater than 0.');
      return;
    }

    const balNum = parseFloat(selectedToken.balance || '0');
    if (amtNum > balNum) {
      setErrorMessage(`Insufficient balance. You only have ${selectedToken.balance} ${selectedToken.symbol}.`);
      return;
    }

    if (useCustomFee && !activeCustom) {
      setErrorMessage('Custom fee is invalid. Enter a max fee above 0 gwei, with a priority fee that is not higher than the max fee.');
      return;
    }

    // Dry-run on-chain so we don't broadcast something that will revert and still cost gas.
    setIsSimulating(true);
    const sim = await TransactionService.simulateTransfer(
      activeChainId, activeAddress, toAddress, amount, selectedToken.address, selectedToken.decimals
    );
    setIsSimulating(false);
    if (!sim.ok) {
      setErrorMessage(`This transfer would fail: ${sim.reason}`);
      return;
    }
    setSimSkipped(!!sim.skipped);
    setFlowStep('summary');
  };

  const handleConfirmSummary = () => {
    if (warnings.length > 0 && !acknowledged) {
      setErrorMessage('Please confirm you understand the warnings above.');
      return;
    }
    setErrorMessage('');
    setFlowStep('passcode');
  };

  const handleSignAndBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!activeVault) return;

    setFlowStep('broadcasting');
    try {
      // 1. Decrypt private key locally with passcode
      const privateKey = await WalletManager.unlockAccountKey(activeVault, activeAccount, passcode);
      if (new ethers.Wallet(privateKey).address.toLowerCase() !== activeAddress.toLowerCase()) {
        throw new Error('Key does not match the active account. Switch account and try again.');
      }

      // 2. Local offline sign & broadcast
      const txRecord = await TransactionService.sendTransaction(
        activeChainId,
        privateKey,
        toAddress,
        amount,
        selectedToken.address,
        selectedToken.decimals,
        selectedToken.symbol,
        nativePriceUSD,
        speed,
        activeCustom
      );
      updateSettings({ gasSpeed: speed });
      haptic([15, 40, 15]);

      setBroadcastTxHash(txRecord.hash);
      setFlowStep('success');
      showToast('Transaction broadcast successfully!', 'success');
      refreshBalances();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      setErrorMessage(msg);
      setFlowStep('failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 page-wash flex flex-col justify-between p-4 md:px-10 lg:px-[10%] overflow-y-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
          <button
            onClick={() => {
              if (flowStep === 'summary') setFlowStep('input');
              else if (flowStep === 'passcode') setFlowStep('summary');
              else onClose();
            }}
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-ink hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-xs font-bold text-ink uppercase tracking-wider">
            {flowStep === 'summary'
              ? 'Review Transaction'
              : flowStep === 'passcode'
              ? 'Authorize Transfer'
              : flowStep === 'success'
              ? 'Transaction Sent'
              : flowStep === 'failed'
              ? 'Transfer Failed'
              : `Send ${selectedToken.symbol}`}
          </span>
          <div className="w-8" />
        </div>

        {errorMessage && flowStep !== 'failed' && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP: INPUT */}
        {flowStep === 'input' && (
          <form onSubmit={handleProceedToSummary} className="space-y-4">
            {/* Token Selector Pill */}
            <div className="relative">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Asset</label>
              <button
                type="button"
                onClick={() => setIsTokenPickerOpen(!isTokenPickerOpen)}
                className="w-full p-3 rounded-2xl bg-slate-100 border border-slate-200 hover:border-slate-200 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <TokenIcon symbol={selectedToken.symbol} size={32} />
                  <div>
                    <span className="text-xs font-bold text-ink block">
                      {selectedToken.name} ({selectedToken.symbol})
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Balance: {parseFloat(selectedToken.balance).toFixed(4)} {selectedToken.symbol}
                    </span>
                  </div>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {/* Token dropdown */}
              {isTokenPickerOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-white border border-slate-200 rounded-2xl shadow-md z-20 max-h-56 overflow-y-auto space-y-1">
                  {tokens.map((t) => (
                    <button
                      key={`${t.chainId}-${t.address}`}
                      type="button"
                      onClick={() => {
                        setSelectedToken(t);
                        setIsTokenPickerOpen(false);
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-slate-100 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <TokenIcon symbol={t.symbol} size={24} />
                        <span className="text-xs font-semibold text-ink">{t.name}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {parseFloat(t.balance).toFixed(3)} {t.symbol}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recipient Address */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">Recipient Address</label>
                <button
                  type="button"
                  onClick={handlePasteAddress}
                  className="text-[11px] text-cyan-600 hover:text-cyan-800 flex items-center gap-1 font-medium transition-colors"
                >
                  <Clipboard size={12} />
                  <span>Paste</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value.trim())}
                  placeholder="0x… or name.eth"
                  spellCheck={false}
                  autoCapitalize="off"
                  className="w-full pl-3.5 pr-11 py-3 rounded-2xl bg-slate-100 border border-slate-200 focus:border-cyan-500 focus:outline-none text-xs font-mono text-ink placeholder-slate-400 tracking-wide"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowBook((v) => !v)}
                  aria-label="Choose from address book"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-cyan-600"
                >
                  <BookUser size={16} />
                </button>
              </div>

              {showBook && (
                <div className="mt-2 rounded-2xl bg-slate-100 border border-slate-200 max-h-44 overflow-y-auto divide-y divide-slate-200">
                  {contacts.length === 0 && recentRecipients.length === 0 && (
                    <p className="p-3 text-[11px] text-slate-500">No saved contacts or recent recipients yet.</p>
                  )}
                  {contacts.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setRecipientInput(c.address); setShowBook(false); }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-200/60 flex items-center justify-between gap-2"
                    >
                      <span className="text-xs font-semibold text-ink truncate">{c.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">{c.address.slice(0, 6)}…{c.address.slice(-4)}</span>
                    </button>
                  ))}
                  {recentRecipients.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => { setRecipientInput(a); setShowBook(false); }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-200/60 flex items-center justify-between gap-2"
                    >
                      <span className="text-xs text-slate-500">Recent</span>
                      <span className="text-[10px] font-mono text-slate-500">{a.slice(0, 6)}…{a.slice(-4)}</span>
                    </button>
                  ))}
                </div>
              )}

              {ensStatus === 'resolving' && <span className="text-[11px] text-slate-500 mt-1 block">Resolving name…</span>}
              {ensStatus === 'ok' && <span className="text-[11px] text-emerald-600 mt-1 block font-mono">{recipientInput} → {toAddress.slice(0, 8)}…{toAddress.slice(-6)}</span>}
              {ensStatus === 'fail' && <span className="text-[11px] text-rose-600 mt-1 block">Couldn't resolve that name.</span>}
              {recipientInput && ensStatus === 'idle' && !ethers.isAddress(recipientInput) && (
                <span className="text-[11px] text-rose-600 mt-1 block">Invalid EVM address format</span>
              )}

              {findings.length > 0 && (
                <ul className="mt-2 space-y-1.5" aria-live="polite">
                  {findings.map((f) => (
                    <li
                      key={f.code}
                      className={`text-[11px] rounded-xl px-3 py-2 flex items-start gap-2 ${
                        f.level === 'block' ? 'bg-rose-50 text-rose-700' : f.level === 'warn' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {f.level === 'info' ? <CheckCircle2 size={13} className="mt-0.5 shrink-0" /> : <AlertTriangle size={13} className="mt-0.5 shrink-0" />}
                      <span>{f.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">Amount</label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Avail: {parseFloat(selectedToken.balance).toFixed(4)}
                  </span>
                  <button
                    type="button"
                    onClick={handleSetMax}
                    className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-600 hover:bg-cyan-500/30 text-[10px] font-bold transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-3 rounded-2xl bg-slate-100 border border-slate-200 focus:border-cyan-500 focus:outline-none text-sm font-mono text-ink placeholder-slate-400"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {selectedToken.symbol}
                </span>
              </div>

              {amount && selectedToken.priceUSD > 0 && (
                <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                  ≈ {fiat(parseFloat(amount) * selectedToken.priceUSD)}
                </span>
              )}
            </div>

            {/* Fee speed */}
            <div role="radiogroup" aria-label="Network fee speed" className="grid grid-cols-3 gap-2">
              {(Object.keys(GAS_SPEED_MULTIPLIERS) as GasSpeed[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={speed === k}
                  onClick={() => setSpeed(k)}
                  className={`py-2 rounded-xl text-center border transition-colors ${
                    speed === k ? 'bg-peach border-peach text-ink' : 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-xs font-semibold">{GAS_SPEED_MULTIPLIERS[k].label}</span>
                  <span className="block text-[10px] opacity-70">{GAS_SPEED_MULTIPLIERS[k].eta}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setUseCustomFee((v) => !v)}
              className="text-[11px] text-slate-500 underline"
            >
              {useCustomFee ? 'Use a preset speed' : 'Set a custom fee (advanced)'}
            </button>
            {useCustomFee && (
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] text-slate-500">
                  Max fee (gwei)
                  <input
                    inputMode="decimal"
                    value={customFee.maxFeeGwei}
                    onChange={(e) => setCustomFee((c) => ({ ...c, maxFeeGwei: e.target.value.replace(/[^0-9.]/g, '') }))}
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-ink"
                    placeholder="e.g. 20"
                  />
                </label>
                <label className="text-[10px] text-slate-500">
                  Priority fee (gwei)
                  <input
                    inputMode="decimal"
                    value={customFee.priorityGwei}
                    onChange={(e) => setCustomFee((c) => ({ ...c, priorityGwei: e.target.value.replace(/[^0-9.]/g, '') }))}
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-ink"
                    placeholder="e.g. 1.5"
                  />
                </label>
              </div>
            )}

            {/* Network Fee Estimation */}
            <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>Estimated Network Fee</span>
                <span className="font-mono text-slate-700">
                  {isEstimatingGas ? (
                    'Estimating...'
                  ) : gasEstimate ? (
                    `${parseFloat(gasEstimate.estimatedFeeNative).toFixed(5)} ${activeNetwork.nativeCurrency.symbol} (~${fiat(gasEstimate.estimatedFeeUSD)})`
                  ) : (
                    'Enter address to calculate'
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Network</span>
                <span className="text-slate-700">{activeNetwork.name}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!toAddress || !amount || !ethers.isAddress(toAddress) || blocked || isSimulating}
              className="w-full h-12 rounded-2xl bg-peach hover:bg-peach-hover disabled:opacity-50 disabled:cursor-not-allowed text-ink font-semibold text-sm transition-all shadow-lg shadow-none"
            >
              {isSimulating ? 'Checking transfer…' : 'Review Transfer'}
            </button>
          </form>
        )}

        {/* STEP: SUMMARY */}
        {flowStep === 'summary' && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-slate-100 border border-slate-200 space-y-3.5">
              <div className="text-center py-2 border-b border-slate-200">
                <span className="text-xs text-slate-400 block mb-1">Sending Amount</span>
                <h3 className="text-2xl font-bold text-ink font-mono">
                  {amount} {selectedToken.symbol}
                </h3>
                {selectedToken.priceUSD > 0 && (
                  <span className="text-xs text-slate-400 font-mono">
                    ≈ {fiat(parseFloat(amount) * selectedToken.priceUSD)}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-400">From</span>
                  <span className="font-mono text-slate-600">
                    {activeAddress.slice(0, 8)}...{activeAddress.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-400">To Recipient</span>
                  <span className="font-mono text-slate-600">
                    {toAddress.slice(0, 8)}...{toAddress.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-400">Blockchain</span>
                  <span className="text-slate-600">{activeNetwork.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-400">Balance after</span>
                  <span className="font-mono text-slate-600">
                    {Math.max(0, parseFloat(selectedToken.balance || '0') - (parseFloat(amount) || 0)).toLocaleString('en-US', { maximumFractionDigits: 6 })} {selectedToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Estimated Gas Fee</span>
                  <span className="font-mono text-slate-600">
                    {gasEstimate?.estimatedFeeNative.slice(0, 8)} {activeNetwork.nativeCurrency.symbol}
                  </span>
                </div>
              </div>
            </div>

            {warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs space-y-2" role="alert">
                {warnings.map((w) => (
                  <p key={w.code} className="flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{w.message}</p>
                ))}
                <label className="flex items-center gap-2 pt-1 font-semibold cursor-pointer">
                  <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
                  I understand and want to continue
                </label>
              </div>
            )}
            {simSkipped && (
              <p className="text-[11px] text-slate-500">We couldn't dry-run this transfer because the network didn't respond, so it wasn't pre-checked.</p>
            )}
            {errorMessage && flowStep === 'summary' && <p role="alert" className="text-xs text-rose-600">{errorMessage}</p>}

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-amber-600" />
              <span>
                Blockchain transactions cannot be reversed once broadcast. Double check the address.
              </span>
            </div>

            <button
              onClick={handleConfirmSummary}
              className="w-full h-12 rounded-2xl bg-peach hover:bg-peach-hover text-slate-950 font-bold text-sm transition-all"
            >
              Confirm & Unlock Key
            </button>
          </div>
        )}

        {/* STEP: PASSCODE */}
        {flowStep === 'passcode' && (
          <form onSubmit={handleSignAndBroadcast} className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-600 flex items-center justify-center mx-auto mb-3">
                <Lock size={22} />
              </div>
              <h3 className="text-base font-bold text-ink mb-1">Enter Security Passcode</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Authorize local signing and transaction broadcast with your device PIN.
              </p>
            </div>

            <div>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode"
                className="w-full px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 focus:border-cyan-500 focus:outline-none text-center text-sm font-mono text-ink placeholder-slate-400"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-2xl bg-peach hover:bg-peach-hover text-ink font-semibold text-sm transition-all"
            >
              Sign & Broadcast Transaction
            </button>
          </form>
        )}

        {/* STEP: BROADCASTING */}
        {flowStep === 'broadcasting' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-ink">Signing & Broadcasting...</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Constructing payload, signing with offline key, and transmitting to {activeNetwork.name} RPC nodes.
            </p>
          </div>
        )}

        {/* STEP: SUCCESS */}
        {flowStep === 'success' && (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-bold text-ink">Transaction Broadcast!</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Your transfer of <span className="text-ink font-semibold">{amount} {selectedToken.symbol}</span> has been broadcast to the network.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-left">
              <span className="text-[11px] text-slate-500 block mb-1">Transaction Hash</span>
              <span className="text-xs font-mono text-cyan-600 break-all select-all">
                {broadcastTxHash}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={`${activeNetwork.blockExplorerUrl}/tx/${broadcastTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-ink flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View on Explorer</span>
                <ExternalLink size={14} />
              </a>
              {!contacts.some((c) => c.address.toLowerCase() === toAddress.toLowerCase()) && (
                <button
                  onClick={() => {
                    const name = window.prompt('Save this recipient as:');
                    if (name?.trim()) {
                      saveContact({ name, address: ethers.getAddress(toAddress) });
                      showToast('Contact saved', 'success');
                    }
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-ink"
                >
                  Save contact
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-peach hover:bg-peach-hover text-slate-950 text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* STEP: FAILED */}
        {flowStep === 'failed' && (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle size={36} />
            </div>
            <h3 className="text-xl font-bold text-ink">Transaction Failed</h3>
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-600 text-left">
              {errorMessage}
            </div>

            <div className="p-3 text-left bg-slate-100 rounded-xl text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-600 block">Suggested resolution:</span>
              <p>• Ensure you have sufficient native coin ({activeNetwork.nativeCurrency.symbol}) to cover network gas fees.</p>
              <p>• Verify you entered the correct passcode to unlock your private key.</p>
              <p>• Check RPC connectivity by switching networks or refreshing.</p>
            </div>

            <button
              onClick={() => setFlowStep('input')}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-100 text-ink text-xs font-bold transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
