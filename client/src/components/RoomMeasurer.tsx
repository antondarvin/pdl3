import React, { useState, useRef, useEffect } from 'react';
import {
  Ruler,
  Camera,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Move,
  RefreshCw,
  CameraOff,
  Sliders,
  Info,
  RotateCw
} from 'lucide-react';

interface RoomMeasurerProps {
  length: number; // in feet
  width: number; // in feet
  height?: number;
  usedAreaSqFt?: number;
  onChange: (dims: { length: number; width: number; height?: number }) => void;
}

export const RoomMeasurer: React.FC<RoomMeasurerProps> = ({
  length,
  width,
  height = 9,
  usedAreaSqFt = 0,
  onChange,
}) => {
  // Measurement Mode: '2d' (Interactive 2D canvas), 'camera' (Camera estimated view), 'manual' (Manual inputs)
  const [measuringMode, setMeasuringMode] = useState<'2d' | 'camera' | 'manual'>('2d');
  
  // Unit System: 'ft' (Feet/Inches) vs 'm' (Meters/Centimeters)
  const [unit, setUnit] = useState<'ft' | 'm'>('ft');

  // Camera state & camera flip (mobile rear camera vs laptop webcam)
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraPoints, setCameraPoints] = useState<{ x: number; y: number }[]>([]);

  // Interactive 2D 4-Corners Drag State
  const [dragCornerIndex, setDragCornerIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Derived metric calculations
  const totalAreaSqFt = Math.round(length * width * 10) / 10;
  const availableAreaSqFt = Math.max(0, Math.round((totalAreaSqFt - usedAreaSqFt) * 10) / 10);
  const remainingAreaSqFt = availableAreaSqFt;

  // Metric conversion factors (1 ft = 0.3048 m, 1 sq ft = 0.092903 sq m)
  const FT_TO_M = 0.3048;
  const SQFT_TO_SQM = 0.092903;

  const lengthM = Math.round(length * FT_TO_M * 100) / 100;
  const widthM = Math.round(width * FT_TO_M * 100) / 100;
  const totalAreaSqM = Math.round(totalAreaSqFt * SQFT_TO_SQM * 100) / 100;
  const availableAreaSqM = Math.round(availableAreaSqFt * SQFT_TO_SQM * 100) / 100;
  const usedAreaSqM = Math.round(usedAreaSqFt * SQFT_TO_SQM * 100) / 100;
  const remainingAreaSqM = availableAreaSqM;

  // Handle manual / input updates
  const handleUpdateLength = (val: number) => {
    const newL = unit === 'ft' ? val : Math.round((val / FT_TO_M) * 10) / 10;
    onChange({ length: Math.max(2, newL), width, height });
  };

  const handleUpdateWidth = (val: number) => {
    const newW = unit === 'ft' ? val : Math.round((val / FT_TO_M) * 10) / 10;
    onChange({ length, width: Math.max(2, newW), height });
  };

  // Quick dimension presets
  const handleApplyPreset = (pLength: number, pWidth: number) => {
    onChange({ length: pLength, width: pWidth, height });
  };

  // Camera Management with facingMode support
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    stopCamera();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera is not supported on this browser/device.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      setCameraError('Camera access unavailable. Using optical surface simulation mode.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  useEffect(() => {
    if (measuringMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [measuringMode]);

  // Handle tapping camera surface to mark 4 corners
  const handleCameraTapCoordinates = (clientX: number, clientY: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    if (cameraPoints.length < 4) {
      const newPoints = [...cameraPoints, { x, y }];
      setCameraPoints(newPoints);

      if (newPoints.length === 4) {
        const xs = newPoints.map((p) => p.x);
        const ys = newPoints.map((p) => p.y);
        const spanX = Math.max(...xs) - Math.min(...xs);
        const spanY = Math.max(...ys) - Math.min(...ys);

        const estLength = Math.max(4, Math.round((spanX / 100) * 20));
        const estWidth = Math.max(3, Math.round((spanY / 100) * 16));
        onChange({ length: estLength, width: estWidth, height });
      }
    }
  };

  // 2D Interactive Canvas Dragging Corner Handles (Mouse & Touch)
  const updateFromPointer = (clientX: number, clientY: number) => {
    if (dragCornerIndex === null || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const normX = Math.max(0.1, Math.min(0.9, (clientX - rect.left) / rect.width));
    const normY = Math.max(0.1, Math.min(0.9, (clientY - rect.top) / rect.height));

    const distFromCenterX = Math.abs(normX - 0.5) * 2;
    const distFromCenterY = Math.abs(normY - 0.5) * 2;

    const newLength = Math.max(3, Math.round(distFromCenterX * 30));
    const newWidth = Math.max(2, Math.round(distFromCenterY * 24));

    onChange({ length: newLength, width: newWidth, height });
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-5 sm:p-8 lg:p-10 border border-[#E2E8F0] shadow-sm space-y-8 animate-fadeIn text-[#0F172A]">
      
      {/* 1. Header with Mode Switcher & Unit Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#2563EB] uppercase block">
            MEASURE MY GARDEN
          </span>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#0F172A] mt-0.5">
            Garden Space Measurement & Area
          </h3>
          <p className="text-xs text-[#64748B] mt-1">
            Define your available botanical perimeter using interactive touch boundaries, camera perspective estimation, or manual length & width.
          </p>
        </div>

        {/* Controls: Unit Toggle & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          
          {/* Unit Toggle: Feet/Inches vs Meters/Centimeters */}
          <div className="bg-[#F1F5F9] p-1 rounded-full border border-[#E2E8F0] flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => setUnit('ft')}
              className={`px-3 py-1.5 rounded-full transition duration-200 min-h-[38px] ${
                unit === 'ft'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              ft / in
            </button>
            <button
              type="button"
              onClick={() => setUnit('m')}
              className={`px-3 py-1.5 rounded-full transition duration-200 min-h-[38px] ${
                unit === 'm'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              m / cm
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="bg-[#F1F5F9] p-1 rounded-full border border-[#E2E8F0] flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => setMeasuringMode('2d')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-full transition duration-200 flex items-center gap-1.5 min-h-[38px] ${
                measuringMode === '2d'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Move className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Interactive 2D</span>
            </button>

            <button
              type="button"
              onClick={() => setMeasuringMode('camera')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-full transition duration-200 flex items-center gap-1.5 min-h-[38px] ${
                measuringMode === 'camera'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Camera View</span>
            </button>

            <button
              type="button"
              onClick={() => setMeasuringMode('manual')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-full transition duration-200 flex items-center gap-1.5 min-h-[38px] ${
                measuringMode === 'manual'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Manual Inputs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Dimension Presets Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Quick Presets:
        </span>
        <button
          type="button"
          onClick={() => handleApplyPreset(10, 8)}
          className={`px-3 py-1.5 rounded-full border text-xs font-semibold shrink-0 transition ${
            length === 10 && width === 8
              ? 'bg-[#2563EB] text-white border-[#2563EB]'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Balcony (10 × 8 ft • 80 sq.ft)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset(15, 10)}
          className={`px-3 py-1.5 rounded-full border text-xs font-semibold shrink-0 transition ${
            length === 15 && width === 10
              ? 'bg-[#2563EB] text-white border-[#2563EB]'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Veranda (15 × 10 ft • 150 sq.ft)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset(20, 15)}
          className={`px-3 py-1.5 rounded-full border text-xs font-semibold shrink-0 transition ${
            length === 20 && width === 15
              ? 'bg-[#2563EB] text-white border-[#2563EB]'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Garden (20 × 15 ft • 300 sq.ft)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset(25, 20)}
          className={`px-3 py-1.5 rounded-full border text-xs font-semibold shrink-0 transition ${
            length === 25 && width === 20
              ? 'bg-[#2563EB] text-white border-[#2563EB]'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Terrace (25 × 20 ft • 500 sq.ft)
        </button>
      </div>

      {/* 2. Main Visual Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Visual Canvas */}
        <div className="lg:col-span-7">
          
          {/* MODE 1: INTERACTIVE 2D BOUNDARY CORNERS (MOUSE + TOUCH) */}
          {measuringMode === '2d' && (
            <div
              ref={canvasRef}
              onMouseMove={(e) => { if (dragCornerIndex !== null) updateFromPointer(e.clientX, e.clientY); }}
              onMouseUp={() => setDragCornerIndex(null)}
              onMouseLeave={() => setDragCornerIndex(null)}
              onTouchMove={(e) => {
                if (dragCornerIndex !== null && e.touches[0]) {
                  updateFromPointer(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchEnd={() => setDragCornerIndex(null)}
              style={{ touchAction: 'none' }}
              className="relative w-full aspect-[4/3] rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 shadow-inner select-none overflow-hidden flex flex-col items-center justify-center cursor-crosshair group"
            >
              {/* Architectural Grid pattern */}
              <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:24px_24px]" />

              {/* Garden Boundary Polygon / Box */}
              <div className="relative w-4/5 h-4/5 rounded-2xl border-2 border-[#2563EB] bg-white/95 shadow-md flex flex-col items-center justify-center p-6 transition-all">
                {/* 4 Interactive Corner Drag Handles with touch support */}
                {[
                  { pos: '-top-3.5 -left-3.5', label: 'C1' },
                  { pos: '-top-3.5 -right-3.5', label: 'C2' },
                  { pos: '-bottom-3.5 -right-3.5', label: 'C3' },
                  { pos: '-bottom-3.5 -left-3.5', label: 'C4' },
                ].map((c, idx) => (
                  <div
                    key={idx}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDragCornerIndex(idx);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      setDragCornerIndex(idx);
                    }}
                    className={`absolute ${c.pos} w-8 h-8 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg ring-4 ring-blue-200 hover:scale-110 active:scale-95 transition duration-150 z-30`}
                    title={`Drag corner ${c.label}`}
                  >
                    {c.label}
                  </div>
                ))}

                {/* Length dimension indicator */}
                <div className="absolute -top-3.5 inset-x-12 flex items-center justify-center pointer-events-none">
                  <div className="bg-white border border-[#2563EB] text-[#2563EB] px-3 py-0.5 rounded-full text-xs font-mono font-bold shadow-xs">
                    Length: {unit === 'ft' ? `${length} ft` : `${lengthM} m`}
                  </div>
                </div>

                {/* Width dimension indicator */}
                <div className="absolute -right-12 top-1/2 -translate-y-1/2 rotate-90 flex items-center justify-center pointer-events-none">
                  <div className="bg-white border border-[#2563EB] text-[#2563EB] px-3 py-0.5 rounded-full text-xs font-mono font-bold shadow-xs whitespace-nowrap">
                    Width: {unit === 'ft' ? `${width} ft` : `${widthM} m`}
                  </div>
                </div>

                {/* Center Badge with Area */}
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-mono tracking-wider text-[#2563EB] uppercase font-bold block">
                    GARDEN BOUNDARY PERIMETER
                  </span>
                  <div className="text-3xl sm:text-4xl font-serif font-bold text-[#0F172A]">
                    {unit === 'ft' ? (
                      <>
                        {totalAreaSqFt} <span className="text-sm font-sans font-normal text-[#64748B]">sq ft</span>
                      </>
                    ) : (
                      <>
                        {totalAreaSqM} <span className="text-sm font-sans font-normal text-[#64748B]">sq m</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] font-mono">
                    {unit === 'ft' ? `${length} ft × ${width} ft` : `${lengthM} m × ${widthM} m`}
                  </p>
                </div>
              </div>

              {/* Guidance Pill */}
              <div className="absolute bottom-3 inset-x-6 text-center text-[11px] text-[#64748B] bg-white/90 backdrop-blur-md py-1.5 px-3 rounded-full border border-[#E2E8F0] shadow-xs">
                💡 Drag the 4 corner handles (C1–C4) to resize your garden boundary with touch or mouse.
              </div>
            </div>
          )}

          {/* MODE 2: CAMERA VIEW (ESTIMATED) */}
          {measuringMode === 'camera' && (
            <div className="space-y-3">
              <div
                onClick={(e) => handleCameraTapCoordinates(e.clientX, e.clientY, e.currentTarget)}
                onTouchStart={(e) => {
                  if (e.touches[0]) {
                    handleCameraTapCoordinates(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
                  }
                }}
                className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900 border border-slate-700 shadow-md cursor-crosshair group"
              >
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full relative">
                    <img
                      src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80"
                      alt="Room / Patio surface"
                      className="w-full h-full object-cover opacity-75"
                    />
                    <div className="absolute inset-0 bg-black/35" />
                  </div>
                )}

                {/* Optical Grid Floor Projection */}
                <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#2563eb_1.5px,transparent_1.5px)] [background-size:24px_24px]" />

                {/* Marked Corners */}
                {cameraPoints.map((pt, idx) => (
                  <div
                    key={idx}
                    style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-30"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#22C55E] text-white text-xs font-bold flex items-center justify-center shadow-xl ring-4 ring-green-300/40">
                      C{idx + 1}
                    </div>
                  </div>
                ))}

                {/* Status HUD Header */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between text-xs text-white z-40 pointer-events-none">
                  <div className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
                    <span>Tap 4 corners ({cameraPoints.length}/4)</span>
                  </div>

                  <div className="pointer-events-auto flex items-center gap-1.5">
                    {cameraActive && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCameraFacing();
                        }}
                        className="bg-black/70 hover:bg-black text-slate-200 px-3 py-1 rounded-full border border-white/20 flex items-center gap-1 transition text-xs"
                        title="Flip Camera (Front / Back)"
                      >
                        <RotateCw className="w-3 h-3 text-[#22C55E]" /> Flip
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCameraPoints([]);
                      }}
                      className="bg-black/70 hover:bg-black text-slate-200 px-3 py-1 rounded-full border border-white/20 flex items-center gap-1 transition text-xs"
                    >
                      <RefreshCw className="w-3 h-3" /> Reset
                    </button>
                  </div>
                </div>

                {/* Prominent Optical Estimation Disclaimer */}
                <div className="absolute bottom-3 inset-x-3 bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-white text-[11px] space-y-1 z-40">
                  <div className="flex items-center gap-1.5 text-[#F97316] font-bold">
                    <Info className="w-3.5 h-3.5" />
                    <span>Camera Measurement Disclaimer (Estimated)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Camera measurements are perspective optical estimates. Standard device cameras without LiDAR do not produce exact millimeter measurements. Verify dimensions with manual entry below.
                  </p>
                </div>
              </div>

              {cameraError && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{cameraError} Tap the simulated courtyard photo above to mark 4 corners.</span>
                </div>
              )}
            </div>
          )}

          {/* MODE 3: DIRECT NUMERIC SLIDERS */}
          {measuringMode === 'manual' && (
            <div className="p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                  MANUAL PRECISION INPUT
                </span>
                <h4 className="text-lg font-serif font-bold text-[#0F172A]">
                  Enter Exact Garden Space Dimensions
                </h4>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Garden Length:</span>
                    <strong className="text-[#2563EB] font-mono">
                      {unit === 'ft' ? `${length} ft` : `${lengthM} m`}
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="60"
                    step={unit === 'ft' ? 1 : 0.5}
                    value={unit === 'ft' ? length : lengthM}
                    onChange={(e) => handleUpdateLength(parseFloat(e.target.value))}
                    className="w-full accent-[#2563EB] cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Garden Width:</span>
                    <strong className="text-[#2563EB] font-mono">
                      {unit === 'ft' ? `${width} ft` : `${widthM} m`}
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="60"
                    step={unit === 'ft' ? 1 : 0.5}
                    value={unit === 'ft' ? width : widthM}
                    onChange={(e) => handleUpdateWidth(parseFloat(e.target.value))}
                    className="w-full accent-[#2563EB] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Real-Time Calculation Statistics Breakdown */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Numeric Input Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-100 transition space-y-1">
              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                Length ({unit})
              </label>
              <input
                type="number"
                min="2"
                max="80"
                step="0.5"
                value={unit === 'ft' ? length : lengthM}
                onChange={(e) => handleUpdateLength(parseFloat(e.target.value) || 0)}
                className="w-full text-2xl font-serif font-bold text-[#0F172A] bg-transparent focus:outline-none font-mono"
              />
              <span className="text-[10px] text-[#64748B] block">Available length</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-100 transition space-y-1">
              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                Width ({unit})
              </label>
              <input
                type="number"
                min="2"
                max="80"
                step="0.5"
                value={unit === 'ft' ? width : widthM}
                onChange={(e) => handleUpdateWidth(parseFloat(e.target.value) || 0)}
                className="w-full text-2xl font-serif font-bold text-[#0F172A] bg-transparent focus:outline-none font-mono"
              />
              <span className="text-[10px] text-[#64748B] block">Available width</span>
            </div>
          </div>

          {/* Area Calculation Breakdown Card (Exact requirement) */}
          <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
              <h4 className="text-sm font-serif font-bold text-[#0F172A]">
                Area Breakdown (Length × Width)
              </h4>
              <span className="text-[10px] font-mono text-[#2563EB] font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                AUTO-CALCULATED
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-[#64748B]">Length:</span>
                <strong className="text-[#0F172A] font-mono text-sm">
                  {unit === 'ft' ? `${length} ft` : `${lengthM} m`}
                </strong>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-[#64748B]">Width:</span>
                <strong className="text-[#0F172A] font-mono text-sm">
                  {unit === 'ft' ? `${width} ft` : `${widthM} m`}
                </strong>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-[#64748B] font-semibold">Total Area:</span>
                <strong className="text-[#2563EB] font-serif text-base">
                  {unit === 'ft' ? `${totalAreaSqFt} sq.ft` : `${totalAreaSqM} sq.m`}
                </strong>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-[#64748B]">Available Area:</span>
                <strong className="text-[#22C55E] font-mono text-sm">
                  {unit === 'ft' ? `${availableAreaSqFt} sq.ft` : `${availableAreaSqM} sq.m`}
                </strong>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-[#64748B]">Used Area:</span>
                <strong className="text-[#F97316] font-mono text-sm">
                  {unit === 'ft' ? `${usedAreaSqFt} sq.ft` : `${usedAreaSqM} sq.m`}
                </strong>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-[#64748B]">Remaining Area:</span>
                <strong className="text-[#0F172A] font-mono text-sm">
                  {unit === 'ft' ? `${remainingAreaSqFt} sq.ft` : `${remainingAreaSqM} sq.m`}
                </strong>
              </div>
            </div>
          </div>

          {/* Plant Capacity Guidance */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] space-y-1.5 leading-relaxed">
            <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              Botanical Capacity Guidance
            </span>
            <p>
              With <strong className="text-[#0F172A]">{totalAreaSqFt} sq.ft</strong>, this space can comfortably accommodate approximately{' '}
              <strong className="text-[#2563EB]">
                {Math.max(2, Math.floor(totalAreaSqFt / 12))} to {Math.max(4, Math.floor(totalAreaSqFt / 6))}
              </strong>{' '}
              medicinal planters while maintaining standard 1.5–2.5 ft plant spacing clearance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
