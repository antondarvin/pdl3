import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, Check, Smartphone, Monitor, ShieldCheck, Sparkles } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstalled?: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled,
}) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    // Detect if already installed / standalone
    const isApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.startsWith('android-app://') ||
      localStorage.getItem('ayush_garden_pwa_installed') === 'true';
    setIsStandalone(isApp);
    if (isApp && onInstalled) {
      onInstalled();
    }
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          try {
            localStorage.setItem('ayush_garden_pwa_installed', 'true');
          } catch (_) {}
          if (onInstalled) {
            onInstalled();
          }
          onClose();
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      } finally {
        setInstalling(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081711]/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md luxury-card bg-[#0B1D16]/95 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-[#D4AF37]/35 text-[#F4EFE6] space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#D4AF37]/15 text-[#A3C1AD] hover:text-[#F4EFE6] transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0E281E] border border-[#D4AF37]/40 p-2.5 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)] shrink-0">
            <span className="text-3xl">🌿</span>
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase block">
              PROGRESSIVE WEB APP
            </span>
            <h3 className="text-xl font-serif font-bold text-[#F4EFE6] leading-tight">
              Virtual Herbal Garden
            </h3>
            <p className="text-xs text-[#A3C1AD]">Royal Botanical Sanctuary Suite</p>
          </div>
        </div>

        {/* Value proposition badges */}
        <div className="grid grid-cols-2 gap-2.5 text-xs text-[#A3C1AD]">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0E281E]/80 border border-[#D4AF37]/20">
            <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>Full-screen 3D & AR</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0E281E]/80 border border-[#D4AF37]/20">
            <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
            <span>Instant Cloud Sync</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0E281E]/80 border border-[#D4AF37]/20">
            <Smartphone className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>Offline Botanical Data</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0E281E]/80 border border-[#D4AF37]/20">
            <Monitor className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>Laptop & Phone Ready</span>
          </div>
        </div>

        {/* Platform-specific installation action */}
        {isStandalone ? (
          <div className="p-4 rounded-2xl bg-[#0E281E]/90 border border-[#D4AF37]/30 text-xs text-[#F4EFE6] flex items-center gap-3">
            <Check className="w-5 h-5 text-[#10B981] shrink-0" />
            <div>
              <strong className="block font-semibold">Sanctuary App Already Installed!</strong>
              <span className="text-[#A3C1AD]">You are currently enjoying the standalone app experience.</span>
            </div>
          </div>
        ) : isIOS ? (
          /* iOS Safari Step-by-Step Instructions */
          <div className="p-4 rounded-2xl bg-[#0E281E]/90 border border-[#D4AF37]/30 text-xs text-[#F4EFE6] space-y-3">
            <strong className="block text-[#D4AF37] font-semibold flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#D4AF37]" />
              How to Install on iPhone / iPad:
            </strong>
            <ol className="space-y-2 text-xs text-[#A3C1AD] list-decimal list-inside leading-relaxed">
              <li>
                Tap the <strong className="text-[#F4EFE6] inline-flex items-center gap-1 font-semibold"><Share2 className="w-3.5 h-3.5 text-[#D4AF37]" /> Share</strong> button in Safari's bottom toolbar.
              </li>
              <li>
                Scroll down and select <strong className="text-[#F4EFE6] inline-flex items-center gap-1 font-semibold"><PlusSquare className="w-3.5 h-3.5 text-[#D4AF37]" /> Add to Home Screen</strong>.
              </li>
              <li>
                Tap <strong className="text-[#F4EFE6] font-semibold">Add</strong> in the top right to complete installation.
              </li>
            </ol>
          </div>
        ) : deferredPrompt ? (
          /* Native 1-Click Install Button (Android / Chrome / Edge / Windows) */
          <div className="space-y-2">
            <button
              onClick={handleInstallClick}
              disabled={installing}
              className="w-full py-3.5 px-6 rounded-2xl luxury-btn-gold text-[#081711] font-bold text-sm tracking-wide shadow-lg shadow-[#D4AF37]/25 transition duration-200 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-[#081711]" />
              <span>{installing ? 'Installing...' : 'Install App to Device'}</span>
            </button>
            <p className="text-[11px] text-center text-[#A3C1AD]">
              Installs a lightweight app package with zero device storage overhead.
            </p>
          </div>
        ) : (
          /* Desktop Browser or manual instruction */
          <div className="p-4 rounded-2xl bg-[#0E281E]/90 border border-[#D4AF37]/30 text-xs text-[#F4EFE6] space-y-2">
            <strong className="block text-[#D4AF37] font-semibold">
              Install via Your Browser Menu:
            </strong>
            <p className="text-xs text-[#A3C1AD] leading-relaxed">
              Click the <strong className="text-[#F4EFE6]">Install</strong> icon in your browser address bar (right side), or open browser settings (⋮ or ⋯) and select <strong className="text-[#F4EFE6]">"Install Virtual Herbal Garden"</strong>.
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-[#D4AF37]/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#A3C1AD] hover:text-[#F4EFE6] transition"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
