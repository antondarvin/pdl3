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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-[#0F172A] space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 p-2.5 flex items-center justify-center shadow-xs shrink-0">
            <span className="text-3xl">🌿</span>
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#2563EB] uppercase block">
              PROGRESSIVE WEB APP
            </span>
            <h3 className="text-xl font-serif font-bold text-[#0F172A] leading-tight">
              Virtual Herbal Garden
            </h3>
            <p className="text-xs text-slate-500">Cross-Platform Botanical Suite</p>
          </div>
        </div>

        {/* Value proposition badges */}
        <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-600">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span>Full-screen 3D & AR</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0" />
            <span>Instant Cloud Sync</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <Smartphone className="w-4 h-4 text-[#F97316] shrink-0" />
            <span>Offline Botanical Data</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <Monitor className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span>Laptop & Phone Ready</span>
          </div>
        </div>

        {/* Platform-specific installation action */}
        {isStandalone ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="block font-semibold">App Already Installed!</strong>
              <span>You are currently enjoying the standalone app experience.</span>
            </div>
          </div>
        ) : isIOS ? (
          /* iOS Safari Step-by-Step Instructions */
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 space-y-3">
            <strong className="block text-[#0F172A] font-semibold flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#2563EB]" />
              How to Install on iPhone / iPad:
            </strong>
            <ol className="space-y-2 text-xs text-slate-600 list-decimal list-inside leading-relaxed">
              <li>
                Tap the <strong className="text-[#0F172A] inline-flex items-center gap-1 font-semibold"><Share2 className="w-3.5 h-3.5 text-[#2563EB]" /> Share</strong> button in Safari's bottom toolbar.
              </li>
              <li>
                Scroll down and select <strong className="text-[#0F172A] inline-flex items-center gap-1 font-semibold"><PlusSquare className="w-3.5 h-3.5 text-[#2563EB]" /> Add to Home Screen</strong>.
              </li>
              <li>
                Tap <strong className="text-[#0F172A] font-semibold">Add</strong> in the top right to complete installation.
              </li>
            </ol>
          </div>
        ) : deferredPrompt ? (
          /* Native 1-Click Install Button (Android / Chrome / Edge / Windows) */
          <div className="space-y-2">
            <button
              onClick={handleInstallClick}
              disabled={installing}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] active:bg-[#C2410C] text-white font-bold text-sm tracking-wide shadow-lg shadow-orange-500/25 transition duration-200 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{installing ? 'Installing...' : 'Install App to Device'}</span>
            </button>
            <p className="text-[11px] text-center text-slate-500">
              Installs a lightweight app package with zero device storage overhead.
            </p>
          </div>
        ) : (
          /* Desktop Browser or manual instruction */
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <strong className="block text-[#0F172A] font-semibold">
              Install via Your Browser Menu:
            </strong>
            <p className="text-xs text-slate-600 leading-relaxed">
              Click the <strong>Install</strong> icon in your browser address bar (right side), or open browser settings (⋮ or ⋯) and select <strong>"Install Virtual Herbal Garden"</strong>.
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
