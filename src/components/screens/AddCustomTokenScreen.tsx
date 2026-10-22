import React, { useState } from 'react';
import { ArrowLeft, Search, PlusCircle, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { ethers } from 'ethers';
import { useWallet } from '../../store/WalletContext';
import { TokenService } from '../../services/blockchain/tokenService';
import { SUPPORTED_NETWORKS } from '../../config/networks';
import { SupportedChainId, TokenMetadata } from '../../types';

interface AddCustomTokenScreenProps {
  onClose: () => void;
}

export const AddCustomTokenScreen: React.FC<AddCustomTokenScreenProps> = ({ onClose }) => {
  const { activeChainId, activeAddress, addCustomToken, showToast } = useWallet();

  const [selectedChainId, setSelectedChainId] = useState<SupportedChainId>(activeChainId);
  const [contractAddress, setContractAddress] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState<number | ''>('');
  const [userBalance, setUserBalance] = useState('0.0');

  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerifyContract = async () => {
    setErrorMessage('');
    setIsVerified(false);

    const cleanAddress = contractAddress.trim();
    if (!ethers.isAddress(cleanAddress)) {
      setErrorMessage('Please enter a valid contract hex address.');
      return;
    }

    setIsVerifying(true);
    try {
      const meta = await TokenService.getTokenMetadata(selectedChainId, cleanAddress);
      setTokenName(meta.name);
      setTokenSymbol(meta.symbol);
      setTokenDecimals(meta.decimals);

      if (activeAddress) {
        const bal = await TokenService.getTokenBalance(
          selectedChainId,
          cleanAddress,
          activeAddress,
          meta.decimals
        );
        setUserBalance(bal.formatted);
      }

      setIsVerified(true);
      showToast(`Detected ${meta.name} (${meta.symbol})`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Contract verification failed';
      setErrorMessage(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified || !contractAddress || !tokenSymbol || tokenDecimals === '') return;

    setIsSubmitting(true);
    try {
      const customToken: TokenMetadata = {
        address: contractAddress.trim(),
        chainId: selectedChainId,
        name: tokenName,
        symbol: tokenSymbol,
        decimals: Number(tokenDecimals),
        isCustom: true,
      };

      await addCustomToken(customToken);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save custom token';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 page-wash flex flex-col justify-between p-4 md:px-10 lg:px-[10%] overflow-y-auto">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Add Custom Token
          </span>
          <div className="w-8" />
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleAddToken} className="space-y-4">
          {/* Network Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Network</label>
            <select
              value={selectedChainId}
              onChange={(e) => {
                setSelectedChainId(Number(e.target.value) as SupportedChainId);
                setIsVerified(false);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 shadow-xs"
            >
              {Object.values(SUPPORTED_NETWORKS).map((net) => (
                <option key={net.chainId} value={net.chainId}>
                  {net.name} ({net.nativeCurrency.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Contract Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Token Contract Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => {
                  setContractAddress(e.target.value.trim());
                  setIsVerified(false);
                }}
                placeholder="0x..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-cyan-500 focus:outline-none text-xs font-mono text-slate-900 placeholder-slate-400 shadow-xs"
                required
              />
              <button
                type="button"
                onClick={handleVerifyContract}
                disabled={isVerifying || !contractAddress}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-50 text-cyan-700 text-xs font-bold transition-colors shrink-0 shadow-xs"
              >
                {isVerifying ? 'Checking...' : 'Find Token'}
              </button>
            </div>
          </div>

          {/* Detected Token Details */}
          {isVerified && (
            <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 space-y-3">
              <div className="flex items-center gap-2 text-cyan-900 text-xs font-bold">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Valid ERC-20 Token Detected On-Chain</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-500 block mb-0.5">Token Name</span>
                  <span className="text-slate-900 font-bold">{tokenName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Token Symbol</span>
                  <span className="text-slate-900 font-mono font-extrabold">{tokenSymbol}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Decimals</span>
                  <span className="text-slate-900 font-mono font-medium">{tokenDecimals}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Your Balance</span>
                  <span className="text-emerald-600 font-mono font-bold">{userBalance}</span>
                </div>
              </div>
            </div>
          )}

          {/* Security Advisory */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
            <ShieldAlert size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Anyone can deploy a token with any name or symbol on EVM blockchains. Always confirm the token's legitimate contract address before interacting.
            </p>
          </div>

          <button
            type="submit"
            disabled={!isVerified || isSubmitting}
            className="w-full h-12 rounded-xl bg-peach hover:bg-peach-hover disabled:opacity-50 disabled:cursor-not-allowed text-ink font-bold text-xs transition-all shadow-md shadow-none"
          >
            {isSubmitting ? 'Saving Token...' : 'Add Custom Token to Wallet'}
          </button>
        </form>
      </div>
    </div>
  );
};
