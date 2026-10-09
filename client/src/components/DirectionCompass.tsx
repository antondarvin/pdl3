import React, { useState, useEffect, useRef } from 'react';
import { Compass, Info, CheckCircle2, RotateCcw, ShieldCheck, AlertCircle, Sparkles, HelpCircle, X, ChevronRight } from 'lucide-react';

interface DirectionCompassProps {
  selectedDirection: string;
  onDirectionChange: (dir: string) => void;
  onConfirmDirection?: () => void;
}

export const CARDINAL_POINTS = [
  { code: 'N', name: 'North', angle: 0, tag: 'Water / Kubera', element: 'Water', deity: 'Kubera' },
  { code: 'NE', name: 'North-East', angle: 45, tag: 'Ishanya / Clarity & Spirit', element: 'Water & Ether', deity: 'Ishana' },
  { code: 'E', name: 'East', angle: 90, tag: 'Solar / Vitality & Health', element: 'Air & Solar', deity: 'Indra' },
  { code: 'SE', name: 'South-East', angle: 135, tag: 'Agni / Energy & Fire', element: 'Fire', deity: 'Agni' },
  { code: 'S', name: 'South', angle: 180, tag: 'Earth / Grounding', element: 'Earth', deity: 'Yama' },
  { code: 'SW', name: 'South-West', angle: 225, tag: 'Nairrutya / Stability', element: 'Earth', deity: 'Niruthi' },
  { code: 'W', name: 'West', angle: 270, tag: 'Varuna / Prosperity', element: 'Water', deity: 'Varuna' },
  { code: 'NW', name: 'North-West', angle: 315, tag: 'Vayu / Movement', element: 'Air', deity: 'Vayu' },
];

export const DirectionCompass: React.FC<DirectionCompassProps> = ({
  selectedDirection,
  onDirectionChange,
  onConfirmDirection,
}) => {
  // Live Heading in degrees (0 - 359)
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  
  // Sensor State: 'active' = receiving real hardware sensor events, 'manual' = user manual selection, 'requesting' = waiting for permission
  const [sensorStatus, setSensorStatus] = useState<'active' | 'manual' | 'calibrating' | 'requesting'>('calibrating');
  const [isLiveSensor, setIsLiveSensor] = useState(false);
  const [iosPermissionNeeded, setIosPermissionNeeded] = useState(false);
  const [calibrationNeeded, setCalibrationNeeded] = useState(false);
  const [showCalibrationGuide, setShowCalibrationGuide] = useState(false);
  const [sensorErrorMessage, setSensorErrorMessage] = useState<string | null>(null);

  // Smooth needle animation damping
  const lastHeadingRef = useRef<number>(0);

  // Helper to map 0-360 degrees to closest cardinal direction
  const getClosestDirection = (deg: number) => {
    const norm = ((deg % 360) + 360) % 360;
    let minDiff = 360;
    let match = 'North';
    CARDINAL_POINTS.forEach((pt) => {
      let diff = Math.abs(norm - pt.angle);
      if (diff > 180) diff = 360 - diff;
      if (diff < minDiff) {
        minDiff = diff;
        match = pt.name;
      }
    });
    return match;
  };

  // Orientation event handler (both Android deviceorientationabsolute and iOS webkitCompassHeading)
  const handleOrientation = (event: DeviceOrientationEvent) => {
    let heading: number | null = null;

    // 1. iOS Safari provides webkitCompassHeading directly relative to North
    if ((event as any).webkitCompassHeading !== undefined && (event as any).webkitCompassHeading !== null) {
      heading = (event as any).webkitCompassHeading;
    }
    // 2. Android absolute orientation (or standard alpha)
    else if ((event as any).absolute === true && event.alpha !== null) {
      heading = 360 - event.alpha;
    } else if (event.alpha !== null && typeof event.alpha === 'number') {
      heading = (360 - event.alpha) % 360;
    }

    if (heading !== null && !isNaN(heading)) {
      const deg = Math.round(((heading % 360) + 360) % 360);
      lastHeadingRef.current = deg;
      setDeviceHeading(deg);
      setIsLiveSensor(true);
      setSensorStatus('active');
      setSensorErrorMessage(null);

      const closest = getClosestDirection(deg);
      if (closest) {
        onDirectionChange(closest);
      }
    }
  };

  // Attach orientation listeners
  const startOrientationListeners = () => {
    if (typeof window === 'undefined') return;
    const win = window as any;

    // Prefer deviceorientationabsolute on Chromium/Android for accurate geographic North
    if ('ondeviceorientationabsolute' in win) {
      win.addEventListener('deviceorientationabsolute', handleOrientation, true);
    } else if ('DeviceOrientationEvent' in win) {
      win.addEventListener('deviceorientation', handleOrientation, true);
    }

    // Compass calibration notification on mobile
    const handleCalibration = () => setCalibrationNeeded(true);
    win.addEventListener('compassneedscalibration', handleCalibration);

    return () => {
      if ('ondeviceorientationabsolute' in win) {
        win.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      }
      win.removeEventListener('deviceorientation', handleOrientation, true);
      win.removeEventListener('compassneedscalibration', handleCalibration);
    };
  };

  // Request iOS permission on user gesture
  const handleRequestIOSPermission = async () => {
    if (
      typeof (DeviceOrientationEvent as any) !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        setSensorStatus('requesting');
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setIosPermissionNeeded(false);
          startOrientationListeners();
        } else {
          setIosPermissionNeeded(false);
          setSensorStatus('manual');
          setSensorErrorMessage('Sensor access was declined in iOS settings. Please use manual direction selection.');
        }
      } catch (err: any) {
        console.warn('iOS Orientation permission error:', err);
        setIosPermissionNeeded(false);
        setSensorStatus('manual');
        setSensorErrorMessage(err.message || 'Unable to request motion sensors.');
      }
    }
  };

  useEffect(() => {
    // Check iOS permission requirement
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as any) !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      setIosPermissionNeeded(true);
      setSensorStatus('manual');
      return;
    }

    // Standard Android / Desktop initialization
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      const cleanup = startOrientationListeners();

      // Grace period: if after 1500ms no sensor event fired, gracefully set manual mode
      const timer = setTimeout(() => {
        if (deviceHeading === null) {
          setSensorStatus('manual');
        }
      }, 1500);

      return () => {
        clearTimeout(timer);
        if (cleanup) cleanup();
      };
    } else {
      setSensorStatus('manual');
    }
  }, []);

  const currentObj = CARDINAL_POINTS.find((p) => p.name === selectedDirection) || CARDINAL_POINTS[1];

  // Visual angle: if live sensor is reading, use the live degree; otherwise use the selected direction cardinal angle
  const activeAngle = isLiveSensor && deviceHeading !== null ? deviceHeading : currentObj.angle;

  return (
    <div className="luxury-card rounded-[2.5rem] p-6 sm:p-10 border border-[#D4AF37]/30 shadow-xl space-y-8 bg-[#0B1D16]/90 backdrop-blur-xl text-[#F4EFE6]">
      {/* 1. Header & Live Sensor Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/25 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase">
              REAL-TIME ORIENTATION SENSOR
            </span>
            {isLiveSensor ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0E281E] text-[#68D391] border border-[#68D391]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#68D391] animate-pulse" />
                Live Sensor Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/15 text-[#F6D985] border border-[#D4AF37]/30">
                Manual Selection Mode
              </span>
            )}
          </div>
          <h3 className="text-2xl font-serif font-bold luxury-gold-text mt-1">
            Digital Compass & Vastu Direction
          </h3>
          <p className="text-xs text-[#A3C1AD] mt-0.5">
            {isLiveSensor
              ? 'Real-time magnetometer reading from your device hardware.'
              : 'Select your room facing direction or calibrate sensor below.'}
          </p>
        </div>

        {/* Current Active Direction Pill */}
        <div className="bg-[#0E281E]/80 px-5 py-2.5 rounded-2xl border border-[#D4AF37]/30 flex items-center gap-3 self-start sm:self-auto shadow-sm">
          <Compass className={`w-5 h-5 ${isLiveSensor ? 'text-[#68D391] animate-spin-slow' : 'text-[#D4AF37]'}`} />
          <div>
            <div className="text-[10px] font-bold text-[#A3C1AD] uppercase">Confirmed Facing</div>
            <div className="text-sm font-serif font-bold text-[#F4EFE6] flex items-center gap-1.5">
              <span>{selectedDirection}</span>
              <span className="text-xs font-mono font-semibold text-[#F6D985]">
                ({isLiveSensor && deviceHeading !== null ? `${deviceHeading}°` : `${currentObj.angle}°`})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. iOS Safari Permission Request Banner */}
      {iosPermissionNeeded && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0E281E]/90 border border-[#D4AF37]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <strong className="text-sm font-bold text-[#F4EFE6] block">Enable iOS Device Compass</strong>
              <p className="text-xs text-[#A3C1AD] mt-0.5 leading-relaxed">
                iOS requires user confirmation to access device magnetometer and gyroscope sensors for live compass rotation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestIOSPermission}
            className="py-2.5 px-5 rounded-full luxury-btn-gold text-[#081711] font-bold text-xs shadow-md shrink-0 transition"
          >
            Allow Compass Access
          </button>
        </div>
      )}

      {/* 3. Sensor Status & Calibration Alert Banner */}
      {calibrationNeeded && (
        <div className="p-4 rounded-2xl bg-[#3D2608] border border-[#D4AF37]/40 text-xs text-[#F6D985] flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#F6D985] shrink-0" />
            <span><strong>Sensor Calibration Needed:</strong> Wave your device in a Figure-8 motion to recalibrate the compass.</span>
          </div>
          <button
            type="button"
            onClick={() => setCalibrationNeeded(false)}
            className="px-3 py-1 rounded-full luxury-btn-secondary font-bold text-xs text-[#F4EFE6]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Calibration Guidance Modal or Expandable Drawer */}
      {showCalibrationGuide && (
        <div className="p-5 rounded-2xl bg-[#0E281E]/90 border border-[#D4AF37]/30 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#D4AF37]/25 pb-2">
            <h4 className="text-sm font-bold text-[#F4EFE6] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              How to Calibrate Your Device Compass
            </h4>
            <button
              onClick={() => setShowCalibrationGuide(false)}
              className="text-[#A3C1AD] hover:text-[#F4EFE6] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#A3C1AD]">
            <div className="p-3 bg-[#081711] rounded-xl border border-[#D4AF37]/20">
              <strong className="text-[#F6D985] block font-semibold">1. Figure-8 Motion</strong>
              <p className="mt-1">Hold your phone flat and gently sweep it in a smooth figure-8 infinity loop in the air 2–3 times.</p>
            </div>
            <div className="p-3 bg-[#081711] rounded-xl border border-[#D4AF37]/20">
              <strong className="text-[#F6D985] block font-semibold">2. Avoid Interference</strong>
              <p className="mt-1">Step away from laptops, metallic railings, speakers, or magnetic phone wallet cases.</p>
            </div>
            <div className="p-3 bg-[#081711] rounded-xl border border-[#D4AF37]/20">
              <strong className="text-[#F6D985] block font-semibold">3. Manual Fallback</strong>
              <p className="mt-1">If sensors are not supported on your browser, simply tap any of the 8 cardinal directions below.</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Circular Modern Compass Dial (8 Directions & Digital Degrees Readout) */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-10 py-4">
        {/* Modern Compass Visualizer */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-[#D4AF37]/35 bg-gradient-to-b from-[#0B1D16] via-[#0E281E] to-[#081711] shadow-2xl flex items-center justify-center select-none">
          {/* Subtle Outer Ticks Ring */}
          <div className="absolute inset-2 rounded-full border border-dashed border-[#D4AF37]/25" />
          <div className="absolute inset-8 rounded-full border border-[#D4AF37]/20" />

          {/* 360-degree tick marks every 45 degrees */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <div
              key={deg}
              style={{ transform: `rotate(${deg}deg)` }}
              className="absolute inset-0 flex flex-col justify-between items-center pointer-events-none py-1.5"
            >
              <div className="w-0.5 h-2 bg-[#D4AF37]/50" />
              <div className="w-0.5 h-2 bg-[#D4AF37]/30" />
            </div>
          ))}

          {/* 8 Cardinal points clickable buttons on perimeter */}
          {CARDINAL_POINTS.map((pt) => {
            const rad = (pt.angle - 90) * (Math.PI / 180);
            const radius = 108; // perimeter offset
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            const isSelected = selectedDirection === pt.name;

            return (
              <button
                key={pt.code}
                type="button"
                onClick={() => onDirectionChange(pt.name)}
                style={{ transform: `translate(${x}px, ${y}px)` }}
                className={`absolute w-9 h-9 -ml-4.5 -mt-4.5 rounded-full text-[11px] font-bold flex items-center justify-center transition-all ${
                  isSelected
                    ? 'luxury-btn-gold text-[#081711] shadow-xl scale-110 ring-4 ring-[#D4AF37]/40 z-20'
                    : 'bg-[#0E281E] text-[#A3C1AD] hover:text-[#F6D985] hover:bg-[#133528] border border-[#D4AF37]/25 shadow-xs'
                }`}
                title={`${pt.name} (${pt.angle}°)`}
              >
                {pt.code}
              </button>
            );
          })}

          {/* Smoothly Rotating Compass Needle */}
          <div
            className="w-4 h-48 sm:h-52 absolute transition-transform duration-300 ease-out z-10 pointer-events-none"
            style={{ transform: `rotate(${activeAngle}deg)` }}
          >
            {/* North tip (Liquid Gold indicator) */}
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[88px] sm:border-b-[98px] border-b-[#D4AF37] mx-auto filter drop-shadow-[0_4px_10px_rgba(212,175,55,0.6)]" />
            {/* South tip (Warm Copper indicator) */}
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[88px] sm:border-t-[98px] border-t-[#E07A5F] mx-auto filter drop-shadow-[0_4px_10px_rgba(224,122,95,0.4)]" />
          </div>

          {/* Center Pivot Pin with Digital Degrees Display */}
          <div className="w-14 h-14 rounded-full bg-[#081711] border-2 border-[#D4AF37] shadow-2xl z-20 flex flex-col items-center justify-center text-[#F4EFE6]">
            <span className="text-[11px] font-mono font-bold leading-none text-[#F6D985]">
              {activeAngle}°
            </span>
            <span className="text-[8px] font-sans text-[#D4AF37] uppercase tracking-wider font-semibold">
              {currentObj.code}
            </span>
          </div>
        </div>

        {/* Selected Direction Details & Cultural Context */}
        <div className="max-w-md space-y-4 text-center lg:text-left">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 bg-[#D4AF37]/15 text-[#F6D985] border border-[#D4AF37]/35 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#68D391]" />
                {selectedDirection} ({currentObj.angle}°)
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#0E281E] border border-[#D4AF37]/20 text-[#A3C1AD]">
                Element: {currentObj.element}
              </span>
            </div>
            <h4 className="text-lg font-serif font-bold text-[#F4EFE6] mt-2">
              {currentObj.tag}
            </h4>
          </div>

          <p className="text-xs text-[#A3C1AD] leading-relaxed">
            In Vastu Shastra, the <strong className="text-[#F6D985]">{selectedDirection}</strong> direction governs specific energy and solar gradients. Aligning your herbal species to this orientation promotes vitality and ensures sunlight levels match botanical needs.
          </p>

          {/* Calibration Guidance Trigger & Sensor Status Help */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowCalibrationGuide(!showCalibrationGuide)}
              className="inline-flex items-center gap-1.5 text-xs text-[#D4AF37] hover:underline font-semibold"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showCalibrationGuide ? 'Hide Guidance' : 'Compass Calibration Guidance'}</span>
            </button>

            {sensorStatus === 'manual' && !isLiveSensor && (
              <span className="text-[11px] text-[#A3C1AD]/70">
                • Tap any direction below to set manually
              </span>
            )}
          </div>

          {/* Confirm Button if prop provided */}
          {onConfirmDirection && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onConfirmDirection}
                className="w-full sm:w-auto py-3 px-6 rounded-full luxury-btn-gold text-[#081711] text-xs font-bold tracking-wider transition shadow-lg flex items-center justify-center gap-2"
              >
                <span>Confirm {selectedDirection} Direction</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Quick Cardinal Selector Grid (All 8 Directions) */}
      <div className="space-y-2 pt-2">
        <label className="text-xs font-bold text-[#A3C1AD] uppercase tracking-wider block">
          Select From All 8 Cardinal Directions
        </label>
        <div id="cardinal-selector" className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {CARDINAL_POINTS.map((pt) => {
            const isSelected = selectedDirection === pt.name;
            return (
              <button
                key={pt.code}
                type="button"
                onClick={() => onDirectionChange(pt.name)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F6D985] shadow-lg ring-2 ring-[#D4AF37]/50'
                    : 'border-[#D4AF37]/20 bg-[#0E281E]/70 text-[#A3C1AD] hover:bg-[#133528]/80 hover:border-[#D4AF37]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F4EFE6]">{pt.name}</span>
                  <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-[#F6D985]' : 'text-[#A3C1AD]/70'}`}>
                    {pt.code} ({pt.angle}°)
                  </span>
                </div>
                <p className="text-[10px] text-[#A3C1AD] truncate mt-1">{pt.tag.split('/')[0]}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
