import React, { useState, useEffect } from 'react';
import { Plant } from '../types';
import { Plant3DViewer } from './Plant3DViewer';
import { detectARCapabilities, ARCapabilityReport } from '../utils/arCapabilities';
import {
  Camera,
  RotateCw,
  Sparkles,
  X,
  Compass,
  Sun,
  Droplets,
  Layers,
  Smartphone,
  Laptop,
  CheckCircle2,
  Info,
  ArrowRight,
  ShieldCheck,
  Maximize2
} from 'lucide-react';

interface ViewInYourSpaceModalProps {
  plant: Plant;
  isOpen: boolean;
  onClose: () => void;
  onLaunchAR: (plant: Plant) => void;
  onAddToGarden: (plant: Plant) => void;
}

export const ViewInYourSpaceModal: React.FC<ViewInYourSpaceModalProps> = ({
  plant,
  isOpen,
  onClose,
  onLaunchAR,
  onAddToGarden,
}) => {
  // Tabs: 'inspect3d' (360 3D inspection) vs 'guidance' (Scanning floor instructions & device check)
  const [activeStep, setActiveStep] = useState<'inspect3d' | 'guidance'>('inspect3d');
  const [capabilities, setCapabilities] = useState<ARCapabilityReport | null>(null);
  const [isCheckingCapabilities, setIsCheckingCapabilities] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setActiveStep('inspect3d');
      setIsCheckingCapabilities(true);
      detectARCapabilities().then((rep) => {
        setCapabilities(rep);
        setIsCheckingCapabilities(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#081711]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-sans">
      <div className="w-full max-w-2xl luxury-card bg-[#0B1D16]/95 rounded-[2.5rem] shadow-2xl border border-[#D4AF37]/35 overflow-hidden flex flex-col max-h-[92vh] text-[#F4EFE6]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#D4AF37]/25 flex items-center justify-between bg-gradient-to-r from-[#0E281E] via-[#0B1D16] to-[#0E281E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center text-[#F6D985]">
              <Camera className="w-5 h-5 text-[#F6D985]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] block">
                AMAZON-STYLE SPATIAL PREVIEW
              </span>
              <h3 className="text-xl font-serif font-bold luxury-gold-text">
                View {plant.name.split(' ')[0]} in Your Space
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#0E281E] text-[#A3C1AD] hover:text-[#F4EFE6] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* STEP 1: 3D PREVIEW & INSPECTION */}
          {activeStep === 'inspect3d' && (
            <div className="space-y-6">
              <div>
                <p className="text-xs text-[#A3C1AD] leading-relaxed">
                  Inspect the 3D botanical model in 360° before launching into real-world Augmented Reality. Rotate, zoom, and verify pot clearance.
                </p>
              </div>

              {/* 3D Botanical Canvas Viewer */}
              <div className="rounded-[2rem] overflow-hidden border border-[#D4AF37]/25 bg-gradient-to-b from-[#081711] to-[#0E281E] shadow-inner">
                <Plant3DViewer
                  modelConfig={plant.model3D}
                  plantName={plant.name}
                  height="340px"
                  autoRotate={true}
                />
              </div>

              {/* Plant Specs Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-[#0E281E]/80 border border-[#D4AF37]/20">
                  <span className="text-[10px] text-[#A3C1AD] uppercase font-bold block">AYUSH System</span>
                  <strong className="text-[#F6D985] mt-0.5 block">{plant.ayushSystem}</strong>
                </div>

                <div className="p-3 rounded-2xl bg-[#0E281E]/80 border border-[#D4AF37]/20">
                  <span className="text-[10px] text-[#A3C1AD] uppercase font-bold block">Recommended Spacing</span>
                  <strong className="text-[#F4EFE6] mt-0.5 block">{plant.spacingRequiredFt || 1.5} ft</strong>
                </div>

                <div className="p-3 rounded-2xl bg-[#0E281E]/80 border border-[#D4AF37]/20">
                  <span className="text-[10px] text-[#A3C1AD] uppercase font-bold block">Sunlight Need</span>
                  <strong className="text-[#E07A5F] mt-0.5 block">{plant.sunlight.split(' ')[0]} Sun</strong>
                </div>

                <div className="p-3 rounded-2xl bg-[#0E281E]/80 border border-[#D4AF37]/20">
                  <span className="text-[10px] text-[#A3C1AD] uppercase font-bold block">Vastu Zone</span>
                  <strong className="text-[#68D391] mt-0.5 block">{plant.vastuDirections[0]}</strong>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SCANNING INSTRUCTIONS & HARDWARE CAPABILITY CHECK */}
          {activeStep === 'guidance' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Capability status badge */}
              <div className="p-4 rounded-3xl bg-[#0E281E]/90 border border-[#D4AF37]/30 space-y-2">
                <div className="flex items-center gap-2">
                  {capabilities?.isMobile ? (
                    <Smartphone className="w-5 h-5 text-[#D4AF37]" />
                  ) : (
                    <Laptop className="w-5 h-5 text-[#D4AF37]" />
                  )}
                  <strong className="text-xs font-bold text-[#F6D985]">
                    {capabilities?.supportsImmersiveAR
                      ? 'WebXR ARCore / ARKit Hardware Ready'
                      : capabilities?.isMobile
                      ? 'Mobile Camera & Spatial Sensor Surface Tracker Ready'
                      : 'Desktop Browser Detected: Interactive 3D Space Ready'}
                  </strong>
                </div>
                <p className="text-[11px] text-[#A3C1AD] leading-relaxed">
                  {capabilities?.message}
                </p>
              </div>

              {/* Floor Scanning Instructions Visual */}
              <div className="p-5 rounded-3xl border border-[#D4AF37]/25 bg-[#081711]/90 space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block">
                  How to Scan Your Room or Garden Floor
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-[#0E281E] border border-[#D4AF37]/20 space-y-1.5 shadow-2xs">
                    <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#F6D985] font-mono font-bold text-xs flex items-center justify-center">
                      1
                    </div>
                    <strong className="text-[#F4EFE6] block text-xs">Aim Camera Down</strong>
                    <p className="text-[11px] text-[#A3C1AD] leading-tight">
                      Point your phone camera toward a flat floor, balcony ground, or table area.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#0E281E] border border-[#D4AF37]/20 space-y-1.5 shadow-2xs">
                    <div className="w-6 h-6 rounded-full bg-[#E07A5F]/20 text-[#E07A5F] font-mono font-bold text-xs flex items-center justify-center">
                      2
                    </div>
                    <strong className="text-[#F4EFE6] block text-xs">Slow Circular Motion</strong>
                    <p className="text-[11px] text-[#A3C1AD] leading-tight">
                      Slowly move your phone in gentle circles so the tracking algorithm maps surface planes.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#0E281E] border border-[#D4AF37]/20 space-y-1.5 shadow-2xs">
                    <div className="w-6 h-6 rounded-full bg-[#68D391]/20 text-[#68D391] font-mono font-bold text-xs flex items-center justify-center">
                      3
                    </div>
                    <strong className="text-[#F4EFE6] block text-xs">Tap to Anchor</strong>
                    <p className="text-[11px] text-[#A3C1AD] leading-tight">
                      When the glowing gold reticle locks onto the surface, tap the screen to place your plant!
                    </p>
                  </div>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="flex items-start gap-2.5 text-[11px] text-[#A3C1AD] p-2">
                <ShieldCheck className="w-4 h-4 text-[#68D391] shrink-0 mt-0.5" />
                <span>Camera feed is analyzed locally in real-time in your browser. No video recordings are ever uploaded or stored.</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-[#D4AF37]/25 bg-[#081711]/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          {activeStep === 'inspect3d' ? (
            <>
              <button
                type="button"
                onClick={() => onAddToGarden(plant)}
                className="w-full sm:w-auto py-3 px-6 rounded-full luxury-btn-copper text-white text-xs font-bold transition"
              >
                + Add to 3D Garden
              </button>

              <button
                type="button"
                onClick={() => setActiveStep('guidance')}
                className="w-full sm:w-auto py-3.5 px-8 rounded-full luxury-btn-gold text-[#081711] text-xs font-bold tracking-wider transition shadow-lg flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-[#081711]" />
                <span>Next: View in Your Space →</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveStep('inspect3d')}
                className="w-full sm:w-auto py-3 px-6 rounded-full luxury-btn-secondary text-xs font-semibold text-[#A3C1AD] hover:text-[#F4EFE6] transition"
              >
                ← Back to 3D Specimen
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLaunchAR(plant);
                }}
                className="w-full sm:w-auto py-3.5 px-8 rounded-full luxury-btn-gold text-[#081711] text-xs font-bold tracking-wider transition shadow-lg flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-[#081711]" />
                <span>Launch Camera AR Preview</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
