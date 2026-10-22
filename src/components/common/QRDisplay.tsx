import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Share2 } from 'lucide-react';
import { useWallet } from '../../store/WalletContext';

interface QRDisplayProps {
  value: string;
  size?: number;
  label?: string;
  showCopy?: boolean;
}

export const QRDisplay: React.FC<QRDisplayProps> = ({
  value,
  size = 200,
  label,
  showCopy = true,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { showToast } = useWallet();

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('Failed to generate QR:', err));
  }, [value, size]);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    showToast('Address copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Wallet Public Address',
          text: value,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* QR Code Container */}
      <div className="p-3 bg-white rounded-2xl shadow-md shadow-slate-300/40 flex items-center justify-center border border-slate-200">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt="Wallet QR Code"
            className="rounded-lg object-contain"
            style={{ width: size, height: size }}
          />
        ) : (
          <div
            style={{ width: size, height: size }}
            className="flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 text-xs"
          >
            Generating QR...
          </div>
        )}
      </div>

      {label && <p className="text-xs text-slate-400 mt-2 text-center">{label}</p>}

      {/* Address Pill & Actions */}
      {showCopy && (
        <div className="mt-4 w-full flex flex-col items-center gap-2.5">
          <div className="w-full max-w-sm px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-slate-600 truncate tracking-wide">
              {value}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors shrink-0"
              title="Copy Address"
              aria-label="Copy Address"
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
