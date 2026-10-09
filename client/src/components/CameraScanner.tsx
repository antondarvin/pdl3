import React, { useRef, useState, useEffect } from 'react';
import { Camera, CameraOff, Sparkles, AlertCircle, RefreshCw, Layers } from 'lucide-react';

interface CameraScannerProps {
  onScanComplete?: (data: { roomAreaIdentified: boolean }) => void;
  onEnterManually?: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScanComplete,
  onEnterManually,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState<'prompt' | 'scanning' | 'locked'>('prompt');
  const [markedSurfaces, setMarkedSurfaces] = useState<{ x: number; y: number }[]>([]);

  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setPermissionError(null);
    stopCamera();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API (getUserMedia) is not supported in this browser environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreamActive(true);
      setScanStep('scanning');
    } catch (err: any) {
      console.warn('Camera access error:', err);
      let msg = 'Camera access was denied or is unavailable.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied. You can proceed using our simulated room scanner or manual entry.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No video capture device was found on this system.';
      }
      setPermissionError(msg);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleTapSurface = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (markedSurfaces.length < 4) {
      const updated = [...markedSurfaces, { x, y }];
      setMarkedSurfaces(updated);
      if (updated.length >= 2 && onScanComplete) {
        onScanComplete({ roomAreaIdentified: true });
      }
    }
  };

  const handleClearPoints = () => {
    setMarkedSurfaces([]);
  };

  return (
    <div className="luxury-card bg-[#0B1D16]/95 rounded-[2.5rem] p-6 sm:p-8 border border-[#D4AF37]/35 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-5 text-[#F4EFE6]">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-serif font-bold luxury-gold-text flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#D4AF37]" />
            Room & Surface Spatial Scanner
          </h3>
          <p className="text-sm text-[#A3C1AD] mt-0.5">
            Scan your room, balcony floor, or windowsill to map out the available botanical space.
          </p>
        </div>
        <span className="px-3 py-1 bg-[#0E281E] text-[#D4AF37] text-xs font-semibold rounded-full border border-[#D4AF37]/30">
          Step 2 • Space Analysis
        </span>
      </div>

      {/* Camera Permission Prompt State */}
      {scanStep === 'prompt' && !streamActive && !permissionError && (
        <div className="rounded-2xl border-2 border-dashed border-[#D4AF37]/30 bg-[#0E281E]/70 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#081711] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h4 className="text-base font-serif font-bold text-[#F4EFE6]">
              Camera Access for Room Visualization
            </h4>
            <p className="text-xs text-[#A3C1AD] leading-relaxed">
              We use your camera to scan your space and help visualize plants in your actual environment.
            </p>
            <p className="text-[11px] text-[#A3C1AD]/70 italic">
              <strong>Transparency note:</strong> Standard webcams do not have depth LiDAR sensors; optical scanning provides an approximate surface guide. All video remains strictly local in your browser.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => startCamera()}
              className="flex-1 py-3 px-5 rounded-full luxury-btn-gold text-[#081711] font-bold text-sm transition duration-200 shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-[#081711]" />
              Allow Camera
            </button>
            <button
              type="button"
              onClick={onEnterManually}
              className="flex-1 py-3 px-5 rounded-full luxury-btn-secondary text-[#F4EFE6] hover:text-[#D4AF37] font-semibold text-sm border border-[#D4AF37]/30 transition duration-200"
            >
              Enter Manually
            </button>
          </div>
        </div>
      )}

      {/* Permission Denied / Error State */}
      {permissionError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-200">Camera Unavailable or Denied</h4>
              <p className="text-xs text-red-300 mt-1">{permissionError}</p>
              <p className="text-xs text-[#A3C1AD] mt-2">
                No worries! You can either use our <strong className="text-[#F4EFE6]">Simulated Botanical Room Scanner</strong> below or proceed directly with <strong className="text-[#F4EFE6]">Manual Room Dimensions</strong>.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setPermissionError(null);
                setScanStep('scanning');
              }}
              className="py-2 px-4 rounded-full luxury-btn-gold text-[#081711] text-xs font-bold flex items-center gap-1.5 transition duration-200"
            >
              <Layers className="w-3.5 h-3.5" />
              Use Simulated Room Environment
            </button>
            <button
              type="button"
              onClick={onEnterManually}
              className="py-2 px-4 rounded-full luxury-btn-secondary text-[#F4EFE6] border border-[#D4AF37]/30 text-xs font-semibold hover:bg-[#D4AF37]/10 transition duration-200"
            >
              Switch to Manual Entry
            </button>
          </div>
        </div>
      )}

      {/* Active Scanning Surface (Live Camera OR Simulated Botanical Room) */}
      {(streamActive || scanStep === 'scanning') && !permissionError && (
        <div className="space-y-3">
          <div
            onClick={handleTapSurface}
            className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-[#081711] cursor-crosshair border border-[#D4AF37]/30 shadow-md group"
          >
            {/* Real video if camera active */}
            {streamActive ? (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />
            ) : (
              /* High-fidelity Simulated Room Background */
              <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#0B1D16] via-[#081711] to-[#040C09] flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
                  alt="Simulated Room Environment"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute top-3 left-3 bg-[#0B1D16]/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-[#D4AF37] border border-[#D4AF37]/30">
                  Simulated Botanical Space (Camera Fallback)
                </div>
              </div>
            )}

            {/* AR Floor Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]" />

            {/* Scanning Reticle in center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-40 border-2 border-dashed border-[#D4AF37]/70 rounded-2xl flex items-center justify-center animate-pulse">
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              </div>
            </div>

            {/* Marked Placement Markers */}
            {markedSurfaces.map((pt, idx) => (
              <div
                key={idx}
                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
              >
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#081711] text-[11px] font-bold flex items-center justify-center shadow-lg ring-4 ring-[#D4AF37]/30">
                  {idx + 1}
                </div>
              </div>
            ))}

            {/* Top Scanning Status Header */}
            <div className="absolute top-3 right-3 bg-[#0B1D16]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D4AF37]/30 text-[#F4EFE6] text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              <span>Tap to mark placement zones ({markedSurfaces.length}/4)</span>
            </div>

            {/* Bottom Guidance Banner */}
            <div className="absolute bottom-3 inset-x-3 bg-[#0B1D16]/90 backdrop-blur-md p-2.5 rounded-xl border border-[#D4AF37]/30 text-[#A3C1AD] flex items-center justify-between text-xs">
              <span>Aim camera at floor, balcony railing, or windowsill.</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearPoints();
                }}
                className="text-[#D4AF37] hover:text-[#F6D985] flex items-center gap-1 underline text-[11px] transition"
              >
                <RefreshCw className="w-3 h-3" /> Clear markers
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#A3C1AD] px-1">
            <span>Points marked: {markedSurfaces.length}</span>
            <div className="flex gap-2">
              {streamActive && (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="text-[#EF4444] hover:underline flex items-center gap-1"
                >
                  <CameraOff className="w-3.5 h-3.5" /> Stop Camera
                </button>
              )}
              <button
                type="button"
                onClick={onEnterManually}
                className="text-[#D4AF37] hover:underline font-medium"
              >
                Use Manual Dimensions Instead →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
