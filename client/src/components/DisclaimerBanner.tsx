import React, { useState } from 'react';
import { X, Info } from 'lucide-react';

interface DisclaimerBannerProps {
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ compact = false }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside aria-label="Educational Disclaimer" className="bg-[#0A1F16]/95 border-b border-[#D4AF37]/20 px-4 py-2 text-[11px] text-[#A3C1AD] shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
          <span>
            <strong className="text-[#F6D985] font-semibold">Educational & Royal Heritage Framework:</strong> AYUSH medicinal plant wisdom and Vastu spatial orientations reflect classical Ayurvedic heritage and cultural spatial balance.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-[#A3C1AD] hover:text-[#F6D985] p-0.5 transition"
          title="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
};
