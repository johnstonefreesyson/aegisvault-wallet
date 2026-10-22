import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';

export const Toast: React.FC = () => {
  const { toast } = useWallet();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />,
    error: <AlertCircle size={18} className="text-rose-600 shrink-0" />,
    info: <Info size={18} className="text-cyan-600 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-cyan-500/30 bg-slate-100 text-slate-700',
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <div
        className={`px-4 py-3 rounded-2xl border shadow-md backdrop-blur-md flex items-center gap-3 ${borders[toast.type]}`}
      >
        {icons[toast.type]}
        <span className="text-xs font-medium leading-relaxed">{toast.message}</span>
      </div>
    </div>
  );
};
