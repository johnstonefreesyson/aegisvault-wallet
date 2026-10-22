import React from 'react';
import { X, Copy, Check, Share2, Shield } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';
import { QRDisplay } from '../common/QRDisplay';

interface AddressViewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddressViewModal: React.FC<AddressViewModalProps> = ({ isOpen, onClose }) => {
  const { activeAddress, walletName, activeNetwork } = useWallet();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Public Wallet Address</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="text-center mb-4">
          <span className="text-xs font-bold text-slate-900 block">{walletName}</span>
          <span className="text-[11px] text-slate-500 font-medium">{activeNetwork.name}</span>
        </div>

        <QRDisplay
          value={activeAddress}
          size={210}
          label="Your public EVM receiving address"
        />

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
