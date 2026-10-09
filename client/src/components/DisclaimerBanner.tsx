import React, { useState } from 'react';
import { X, Info } from 'lucide-react';

interface DisclaimerBannerProps {
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ compact = false }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside aria-label="Educational Disclaimer" className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 text-[11px] text-[#64748B]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
          <span>
            <strong className="text-[#0F172A]">Educational & Traditional Framework:</strong> AYUSH medicinal plant information and Vastu directional orientations reflect classical cultural heritage and do not constitute clinical medical claims.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-[#64748B] hover:text-[#0F172A] p-0.5 transition"
          title="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
};
