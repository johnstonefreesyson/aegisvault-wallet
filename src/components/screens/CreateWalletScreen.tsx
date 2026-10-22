import { ethers } from 'ethers';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldAlert, Copy, Check, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import { WalletManager } from '../../services/blockchain/walletManager';
import { useWallet } from '../../store/WalletContext';

export const CreateWalletScreen: React.FC = () => {
  const { setCurrentScreen, createWallet, showToast } = useWallet();

  const [step, setStep] = useState<'details' | 'reveal' | 'verify'>('details');
  const [walletName, setWalletName] = useState('My Main Wallet');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  
  // Real 12-word seed phrase generated from entropy
  const [mnemonic, setMnemonic] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isRevealed, setIsRevealed] = useState(true);
  const [understoodRisk, setUnderstoodRisk] = useState(false);

  // Verification quiz states
  const [quizIndices, setQuizIndices] = useState<number[]>([]);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, string>>({});
  const [quizOptions, setQuizOptions] = useState<Record<number, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Generate real BIP-39 mnemonic on mount
  useEffect(() => {
    const phrase = WalletManager.generateMnemonic();
    setMnemonic(phrase);
    const splitWords = phrase.split(' ');
    setWords(splitWords);

    // Pick 3 distinct random positions to verify (crypto-random, not a fixed pattern)
    const rnd = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
    const picked = new Set<number>();
    while (picked.size < 3) picked.add(rnd(splitWords.length));
    const indices = [...picked].sort((x, y) => x - y);
    setQuizIndices(indices);

    // Distractors are real BIP-39 words, so the right answer can't be spotted by "looking unusual"
    const list = ethers.wordlists.en;
    const optionsMap: Record<number, string[]> = {};
    indices.forEach((idx) => {
      const correctWord = splitWords[idx];
      const options = new Set<string>([correctWord]);
      while (options.size < 4) {
        const w = list.getWord(rnd(2048));
        if (!splitWords.includes(w)) options.add(w);
      }
      optionsMap[idx] = [...options].sort(() => rnd(2) - 0.5);
    });

    setQuizOptions(optionsMap);
  }, []);

  const handleCopyPhrase = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    showToast('Secret phrase copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceedToReveal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!walletName.trim()) {
      setErrorMsg('Please enter a wallet name.');
      return;
    }
    if (passcode.length < 6) {
      setErrorMsg('Security passcode must be at least 6 characters.');
      return;
    }
    if (passcode !== confirmPasscode) {
      setErrorMsg('Passcodes do not match.');
      return;
    }

    setStep('reveal');
  };

  const handleProceedToVerify = () => {
    if (!understoodRisk) {
      setErrorMsg('Please confirm that you have written down your phrase.');
      return;
    }
    setErrorMsg('');
    setStep('verify');
  };

  const handleSelectQuizOption = (index: number, word: string) => {
    setSelectedQuizAnswers((prev) => ({
      ...prev,
      [index]: word,
    }));
  };

  const handleFinalizeWallet = async () => {
    setErrorMsg('');
    // Verify each test word matches
    for (const idx of quizIndices) {
      if (selectedQuizAnswers[idx] !== words[idx]) {
        setErrorMsg(`Incorrect word selected for Word #${idx + 1}. Please verify and try again.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await createWallet(walletName, mnemonic, passcode);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create wallet';
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] page-wash flex flex-col justify-between p-5 md:px-10 lg:px-[10%]">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
          <button
            onClick={() => {
              if (step === 'verify') setStep('reveal');
              else if (step === 'reveal') setStep('details');
              else setCurrentScreen('welcome');
            }}
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-ink hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-xs font-semibold text-slate-400">
            Step {step === 'details' ? '1' : step === 'reveal' ? '2' : '3'} of 3
          </span>
          <div className="w-8" />
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Details & Passcode */}
        {step === 'details' && (
          <form onSubmit={handleProceedToReveal} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-ink tracking-tight">Name & Secure Your Wallet</h2>
              <p className="text-xs text-slate-400 mt-1">
                Set a local security PIN or passcode to encrypt your private keys on this device.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Wallet Name
                </label>
                <input
                  type="text"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  placeholder="e.g. Primary Multi-Chain"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 focus:border-cyan-500 focus:outline-none text-sm text-ink placeholder-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Security Passcode / PIN (min 6 characters)
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter strong passcode"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 focus:border-cyan-500 focus:outline-none text-sm text-ink placeholder-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Confirm Security Passcode
                </label>
                <input
                  type="password"
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  placeholder="Repeat passcode"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 focus:border-cyan-500 focus:outline-none text-sm text-ink placeholder-slate-400"
                  required
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs flex items-start gap-2.5 mt-4">
              <Lock size={16} className="text-cyan-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                This passcode never leaves your device. It is used to derive a 256-bit AES key via PBKDF2 to encrypt your vault.
              </p>
            </div>

            <button
              type="submit"
              className="w-full mt-6 h-12 rounded-xl bg-peach hover:bg-peach-hover text-ink font-semibold text-sm transition-all shadow-lg shadow-none"
            >
              Continue to Recovery Phrase
            </button>
          </form>
        )}

        {/* STEP 2: Backup Seed Phrase */}
        {step === 'reveal' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-ink tracking-tight">Secret Recovery Phrase</h2>
              <p className="text-xs text-slate-400 mt-1">
                Write down these 12 words in correct order and store them in a secure physical location.
              </p>
            </div>

            {/* Warning Callout */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-start gap-2.5">
              <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Never share these words with anyone. Anyone who gets this phrase has complete control of your crypto funds. AegisVault will NEVER ask for your phrase.
              </p>
            </div>

            {/* 12-Word Grid */}
            <div className="relative p-4 rounded-2xl bg-slate-100 border border-slate-200 shadow-md">
              <div className="grid grid-cols-3 gap-2.5">
                {words.map((word, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2"
                  >
                    <span className="text-[11px] font-mono text-slate-500 select-none w-4 text-right">
                      {idx + 1}.
                    </span>
                    <span className="text-xs font-mono font-medium text-ink truncate">
                      {isRevealed ? word : '••••••'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 text-xs">
                <button
                  onClick={() => setIsRevealed(!isRevealed)}
                  className="text-slate-400 hover:text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{isRevealed ? 'Hide Words' : 'Show Words'}</span>
                </button>
                <button
                  onClick={handleCopyPhrase}
                  className="text-cyan-600 hover:text-cyan-800 font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Phrase'}</span>
                </button>
              </div>
            </div>

            {/* Checkbox confirmation */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-100 border border-slate-200 cursor-pointer text-xs text-slate-600 mt-2">
              <input
                type="checkbox"
                checked={understoodRisk}
                onChange={(e) => setUnderstoodRisk(e.target.checked)}
                className="mt-0.5 rounded border-slate-200 text-cyan-500 focus:ring-cyan-500"
              />
              <span>
                I understand that if I lose my recovery phrase, I will permanently lose access to my funds and nobody can recover it for me.
              </span>
            </label>

            <button
              onClick={handleProceedToVerify}
              disabled={!understoodRisk}
              className="w-full mt-4 h-12 rounded-xl bg-peach hover:bg-peach-hover disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold text-sm transition-all"
            >
              Verify Recovery Phrase
            </button>
          </div>
        )}

        {/* STEP 3: Verify Words Quiz */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-ink tracking-tight">Confirm Backup</h2>
              <p className="text-xs text-slate-400 mt-1">
                Select the correct word for each position to verify your backup.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {quizIndices.map((quizIdx) => (
                <div key={quizIdx} className="p-3.5 rounded-xl bg-slate-100 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-600 block mb-2.5">
                    Select Word #{quizIdx + 1}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {quizOptions[quizIdx]?.map((option) => {
                      const isSelected = selectedQuizAnswers[quizIdx] === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleSelectQuizOption(quizIdx, option)}
                          className={`py-2 px-3 rounded-xl text-xs font-mono font-medium border transition-all ${
                            isSelected
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-800 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-200'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleFinalizeWallet}
              disabled={isSubmitting || Object.keys(selectedQuizAnswers).length < quizIndices.length}
              className="w-full mt-6 h-12 rounded-xl bg-peach hover:bg-peach-hover disabled:opacity-50 disabled:cursor-not-allowed text-ink font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-none"
            >
              {isSubmitting ? (
                <span>Deriving & Encrypting Keys...</span>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Finish Setup & Open Wallet</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
