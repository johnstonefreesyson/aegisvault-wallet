import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface ScreenShellProps {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
}

/** Full-screen overlay with a back button, matching the Address Book screen. */
export const ScreenShell: React.FC<ScreenShellProps> = ({ title, onBack, right, children }) => (
  <div className="fixed inset-0 z-50 page-wash md:px-10 lg:px-[10%] overflow-y-auto px-5 pt-5 pb-10">
    <div className="relative flex items-center justify-center h-10 mb-4">
      <button onClick={onBack} aria-label="Back" className="absolute left-0 p-2 -ml-2 text-ink/70 hover:text-ink">
        <ChevronLeft size={22} />
      </button>
      <span className="text-sm text-ink/80">{title}</span>
      {right && <div className="absolute right-0">{right}</div>}
    </div>
    {children}
  </div>
);
