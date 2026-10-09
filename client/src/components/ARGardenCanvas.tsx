import React, { useRef, useState, useEffect } from 'react';
import { PlacedPlant, Plant } from '../types';
import { 
  ArrowLeft, 
  Camera, 
  CameraOff, 
  Plus, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Trash2, 
  Save, 
  X,
  Sparkles,
  Info,
  ShieldCheck,
  AlertTriangle,
  Move
} from 'lucide-react';

interface ARGardenCanvasProps {
  plants: PlacedPlant[];
  catalogPlants: Plant[];
  onUpdatePlants: (plants: PlacedPlant[]) => void;
  direction: string;
  onBackToWizard?: () => void;
  onSaveGarden?: () => void;
  onFallbackTo3D?: () => void;
}

export const ARGardenCanvas: React.FC<ARGardenCanvasProps> = ({
  plants,
  catalogPlants,
  onUpdatePlants,
  direction,
  onBackToWizard,
  onSaveGarden,
  onFallbackTo3D,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(plants[0]?.id || null);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    setHasRequestedPermission(true);
    stopCamera();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera hardware access is unavailable on this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreamActive(true);
    } catch (err: any) {
      console.warn('Camera could not be accessed:', err);
      let msg = 'Camera permission was denied or camera hardware was not found.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied in your browser settings. You can switch to the 3D garden planner below.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No video capture device was detected on this computer/phone.';
      }
      setCameraError(msg);
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (streamActive) {
      startCamera(nextFacing);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const activePlant = plants.find((p) => p.id === selectedPlantId) || plants[0] || null;

  // Drag / move plant on screen
  const handleTouchMoveCanvas = (clientX: number, clientY: number, target: HTMLElement) => {
    if (!selectedPlantId) return;
    const rect = target.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    onUpdatePlants(
      plants.map((p) =>
        p.id === selectedPlantId
          ? {
              ...p,
              x: Math.max(10, Math.min(90, Math.round(x))),
              y: Math.max(20, Math.min(85, Math.round(y))),
            }
          : p
      )
    );
  };

  const handleRotate = () => {
    if (!selectedPlantId) return;
    onUpdatePlants(
      plants.map((p) =>
        p.id === selectedPlantId ? { ...p, rotation: (p.rotation + 45) % 360 } : p
      )
    );
  };

  const handleResize = (delta: number) => {
    if (!selectedPlantId) return;
    onUpdatePlants(
      plants.map((p) =>
        p.id === selectedPlantId
          ? { ...p, scale: Math.max(0.6, Math.min(2.2, Math.round((p.scale + delta) * 10) / 10)) }
          : p
      )
    );
  };

  const handleDelete = () => {
    if (!selectedPlantId) return;
    const remaining = plants.filter((p) => p.id !== selectedPlantId);
    onUpdatePlants(remaining);
    setSelectedPlantId(remaining[0]?.id || null);
  };

  const handleAddPlant = (plant: Plant) => {
    const newPlaced: PlacedPlant = {
      id: `placed_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      plantId: plant._id,
      name: plant.name,
      scientificName: plant.scientificName,
      image: plant.image,
      x: 50 + (Math.random() * 20 - 10),
      y: 55 + (Math.random() * 20 - 10),
      rotation: 0,
      scale: 1.0,
      model3D: plant.model3D,
      potSizeFt: plant.defaultPotDiameterFt || 1.0,
      spacingRequiredFt: plant.spacingRequiredFt || 1.5,
    };
    onUpdatePlants([...plants, newPlaced]);
    setSelectedPlantId(newPlaced.id);
    setShowCatalogModal(false);
  };

  return (
    <div className="relative w-full h-[540px] sm:h-[650px] lg:h-[720px] rounded-3xl overflow-hidden bg-slate-950 select-none shadow-2xl border border-slate-800">
      
      {/* 1. CAMERA PRE-PERMISSION SCREEN (Only requests camera after user selection!) */}
      {!streamActive && (
        <div className="absolute inset-0 z-30 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-white space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-inner">
            <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
          </div>

          <div className="max-w-md space-y-2">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#2563EB] uppercase block">
              REAL-WORLD SPATIAL AUGMENTED REALITY
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
              Launch Plant AR Visualizer
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visualize selected medicinal planters inside your room, balcony floor, or windowsill using your camera feed.
            </p>
          </div>

          {/* Camera facing selector */}
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-full border border-slate-800 text-xs font-semibold text-slate-300">
            <button
              type="button"
              onClick={() => setCameraFacing('environment')}
              className={`px-3 py-1.5 rounded-full transition ${
                cameraFacing === 'environment' ? 'bg-[#2563EB] text-white shadow-xs' : 'hover:text-white'
              }`}
            >
              Back Camera (Phone)
            </button>
            <button
              type="button"
              onClick={() => setCameraFacing('user')}
              className={`px-3 py-1.5 rounded-full transition ${
                cameraFacing === 'user' ? 'bg-[#2563EB] text-white shadow-xs' : 'hover:text-white'
              }`}
            >
              Webcam (Laptop)
            </button>
          </div>

          {cameraError ? (
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 max-w-sm space-y-2">
              <div className="flex items-center gap-1.5 text-red-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Camera Unavailable</span>
              </div>
              <p className="text-[11px] leading-relaxed">{cameraError}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-slate-500 max-w-sm">
              <Info className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              <span>Permission is requested only after selecting Start AR. Video remains strictly local in your browser.</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center pt-2">
            <button
              type="button"
              onClick={() => startCamera(cameraFacing)}
              className="py-3 px-6 rounded-full bg-[#F97316] hover:bg-[#EA580C] active:bg-[#C2410C] text-white font-bold text-xs tracking-wider transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>Start AR Camera</span>
            </button>

            {onFallbackTo3D && (
              <button
                type="button"
                onClick={onFallbackTo3D}
                className="py-3 px-6 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs tracking-wider transition shadow-md flex items-center justify-center gap-2"
              >
                <span>3D Garden Fallback</span>
              </button>
            )}

            {onBackToWizard && (
              <button
                type="button"
                onClick={onBackToWizard}
                className="py-3 px-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs tracking-wider border border-slate-700 transition"
              >
                Back
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. LIVE CAMERA CANVAS WITH PLANTS OVERLAY */}
      <div
        ref={containerRef}
        onClick={(e) => handleTouchMoveCanvas(e.clientX, e.clientY, e.currentTarget)}
        onTouchMove={(e) => {
          if (e.touches[0]) {
            handleTouchMoveCanvas(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
          }
        }}
        className="absolute inset-0 w-full h-full cursor-crosshair overflow-hidden"
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-full h-full object-cover"
        />

        {/* Optical Ground Perspective Grid Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-3/5 pointer-events-none opacity-30 [perspective:600px]">
          <div className="w-full h-full [transform:rotateX(68deg)] bg-[radial-gradient(#2563eb_1.5px,transparent_1.5px)] [background-size:28px_28px]" />
        </div>

        {/* Placed Plants Staged in Augmented Reality */}
        {plants.map((p) => {
          const isSelected = p.id === selectedPlantId;
          const pixelHeight = Math.round(180 * p.scale);

          return (
            <div
              key={p.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPlantId(p.id);
              }}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: `translate(-50%, -85%) rotate(${p.rotation}deg)`,
              }}
              className={`absolute cursor-pointer transition-transform ${
                isSelected ? 'scale-105 z-30' : 'z-20 hover:scale-102'
              }`}
            >
              <div
                className={`relative flex flex-col items-center justify-end rounded-2xl p-1 transition-all ${
                  isSelected ? 'ring-2 ring-[#2563EB] shadow-2xl bg-black/25' : ''
                }`}
                style={{ height: `${pixelHeight}px` }}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-full object-contain filter drop-shadow-[0_16px_20px_rgba(0,0,0,0.7)]"
                  style={{ maxHeight: `${pixelHeight}px` }}
                />

                {/* Spatial Base Anchor */}
                <div className="w-24 h-5 bg-black/60 rounded-full blur-xs -mt-2.5 -z-10 border border-[#2563EB]/40" />

                {/* Botanical Specs Pill (Plant Name, Spacing, Dimensions) */}
                {isSelected && (
                  <div
                    className="absolute -top-10 whitespace-nowrap bg-black/90 backdrop-blur-md text-white text-[10px] font-semibold px-3 py-1 rounded-full border border-[#2563EB]/70 shadow-xl pointer-events-none space-x-1"
                    style={{ transform: `rotate(${-p.rotation}deg)` }}
                  >
                    <span className="font-bold text-emerald-400">🌿 {p.name}</span>
                    <span className="text-slate-400">• Spacing: {p.spacingRequiredFt || 1.5} ft</span>
                    <span className="text-slate-400">• Scale: {p.scale}x</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. TOP BAR HUD (Navigation, Camera Flip, Mode Pill) */}
      <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 flex items-center justify-between pointer-events-none z-40">
        <div className="flex items-center gap-2 pointer-events-auto">
          {onBackToWizard && (
            <button
              type="button"
              onClick={onBackToWizard}
              className="p-2.5 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 hover:bg-black transition shadow min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Return to 3D Garden"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="bg-black/70 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/15 text-white flex items-center gap-2 shadow-2xl text-xs">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="font-serif font-bold text-emerald-400 tracking-wider uppercase">
              CAMERA AR
            </span>
            <span className="text-slate-400 text-[10px] hidden sm:inline">| {direction}</span>
          </div>
        </div>

        {/* Right Camera Controls (Flip Camera / Stop Camera / 3D Fallback) */}
        {streamActive && (
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {onFallbackTo3D && (
              <button
                type="button"
                onClick={onFallbackTo3D}
                className="bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs border border-white/20 hover:bg-black transition flex items-center gap-1"
                title="Switch to 3D Visualization"
              >
                <span className="text-[11px]">3D View</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleCameraFacing}
              className="bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs border border-white/20 hover:bg-black transition flex items-center gap-1"
              title="Flip Front / Rear Camera"
            >
              <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] hidden sm:inline">Flip Cam</span>
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs border border-white/20 hover:bg-black transition flex items-center gap-1"
              title="Stop Camera"
            >
              <CameraOff className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[11px] hidden sm:inline">Stop</span>
            </button>
          </div>
        )}
      </div>

      {/* Optical Estimation Disclaimer Pill */}
      {streamActive && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-black/75 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10 text-slate-300 text-[10px] flex items-center gap-1.5 pointer-events-none">
          <Info className="w-3 h-3 text-[#2563EB]" />
          <span>Estimated optical overlay (Non-LiDAR). Tap screen to reposition plant.</span>
        </div>
      )}

      {/* 4. BOTTOM BAR: ACTIVE PLANT ACTIONS & GLOBAL SAVE */}
      {streamActive && (
        <div className="absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 pointer-events-none z-40">
          
          {/* Active Plant Controls */}
          {activePlant ? (
            <div className="pointer-events-auto bg-black/85 backdrop-blur-2xl rounded-2xl p-2 border border-white/15 shadow-2xl flex items-center gap-1 text-white">
              <button
                type="button"
                onClick={handleRotate}
                className="p-2.5 rounded-xl hover:bg-white/10 text-white transition active:scale-95"
                title="Rotate 45°"
              >
                <RotateCw className="w-4 h-4 text-[#2563EB]" />
              </button>
              <button
                type="button"
                onClick={() => handleResize(0.1)}
                className="p-2.5 rounded-xl hover:bg-white/10 text-white transition active:scale-95"
                title="Scale Larger"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleResize(-0.1)}
                className="p-2.5 rounded-xl hover:bg-white/10 text-white transition active:scale-95"
                title="Scale Smaller"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-2.5 rounded-xl hover:bg-red-900/50 text-red-400 transition active:scale-95"
                title="Remove Plant"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="pointer-events-auto bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-slate-300 border border-white/10">
              Tap any plant to position in camera space.
            </div>
          )}

          {/* Add Plant & Save Garden buttons */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCatalogModal(true)}
              className="py-2.5 px-4 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-xs border border-white/20 transition flex items-center gap-1.5 min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Plant</span>
            </button>

            {onSaveGarden && (
              <button
                type="button"
                onClick={onSaveGarden}
                className="py-2.5 px-5 rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs tracking-wider transition shadow-lg shadow-orange-500/20 flex items-center gap-1.5 min-h-[44px]"
              >
                <Save className="w-3.5 h-3.5 text-white" />
                <span>Save</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. ADD PLANT MODAL IN AR */}
      {showCatalogModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl text-[#0F172A] space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h4 className="text-base font-serif font-bold text-[#0F172A]">
                Place Plant in AR Space
              </h4>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {catalogPlants.map((plant) => (
                <div
                  key={plant._id}
                  onClick={() => handleAddPlant(plant)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-[#2563EB] hover:bg-blue-50/50 cursor-pointer flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={plant.image}
                      alt={plant.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div>
                      <h5 className="text-xs font-serif font-bold text-[#0F172A]">
                        {plant.name}
                      </h5>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Spacing: {plant.spacingRequiredFt || 1.5} ft
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#2563EB]">Place +</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
