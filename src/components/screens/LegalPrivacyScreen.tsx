import React from 'react';
import { ArrowLeft, Shield, Lock, FileText } from 'lucide-react';

interface LegalPrivacyScreenProps {
  onBack: () => void;
}

export const LegalPrivacyScreen: React.FC<LegalPrivacyScreenProps> = ({ onBack }) => {
  return (
    <div className="pb-24 px-4 pt-3 md:px-10 lg:px-[10%] space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Privacy Policy & Legal
        </span>
        <div className="w-8" />
      </div>

      <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
        {/* Card 1 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-cyan-700 font-bold text-xs">
            <Lock size={15} />
            <span>Non-Custodial Architecture</span>
          </div>
          <p>
            AegisVault is a decentralized, non-custodial software wallet. We do not store, manage, transmit, or have custody over your private keys, seed phrases, or cryptocurrency assets. All private keys and recovery words are generated using cryptographic pseudo-randomness and stored solely on your local device encrypted with AES-GCM 256-bit.
          </p>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
            <Shield size={15} />
            <span>Third-Party Network Providers</span>
          </div>
          <p>
            When querying balances, broadcasting signed transactions, or fetching market prices, your device communicates directly with public RPC nodes (Cloudflare, Ankr, LlamaRPC, PublicNode) and the CoinGecko public API. Token logos are sourced from the open-source TrustWallet assets repository.
          </p>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
            <FileText size={15} />
            <span>Limitation of Liability & Risk Notice</span>
          </div>
          <p>
            Cryptocurrency transactions on public blockchains are irreversible. You are solely responsible for backing up and safeguarding your 12-word recovery phrase. Losing your recovery phrase means irreversible loss of access to your funds. AegisVault does not warrant against network congestion, smart contract exploits, or user error.
          </p>
        </div>
      </div>
    </div>
  );
};
