import React, { useState, useRef } from 'react';
import { PlacedPlant } from '../types';
import { RotateCw, Trash2, ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface Garden2DPlannerProps {
  length: number;
  width: number;
  direction: string;
  plants: PlacedPlant[];
  onUpdatePlants: (plants: PlacedPlant[]) => void;
  onSelectPlantInfo?: (plant: PlacedPlant) => void;
}

export const Garden2DPlanner: React.FC<Garden2DPlannerProps> = ({
  length,
  width,
  direction,
  plants,
  onUpdatePlants,
  onSelectPlantInfo,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedPlant = plants.find((p) => p.id === selectedId);

  const handleDragPlant = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedId(id);
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const xPercent = Math.max(8, Math.min(92, ((moveEvent.clientX - rect.left) / rect.width) * 100));
      const yPercent = Math.max(8, Math.min(92, ((moveEvent.clientY - rect.top) / rect.height) * 100));

      onUpdatePlants(
        plants.map((p) => (p.id === id ? { ...p, x: Math.round(xPercent), y: Math.round(yPercent) } : p))
      );
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleRotate = (degDelta: number) => {
    if (!selectedId) return;
    onUpdatePlants(
      plants.map((p) =>
        p.id === selectedId ? { ...p, rotation: (p.rotation + degDelta + 360) % 360 } : p
      )
    );
  };

  const handleScale = (delta: number) => {
    if (!selectedId) return;
    onUpdatePlants(
      plants.map((p) =>
        p.id === selectedId
          ? { ...p, scale: Math.max(0.6, Math.min(2.0, Math.round((p.scale + delta) * 10) / 10)) }
          : p
      )
    );
  };

  const handleDelete = (id: string) => {
    onUpdatePlants(plants.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="space-y-6 text-[#F4EFE6]">
      {/* Dimension & Direction Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 luxury-card rounded-2xl border border-[#D4AF37]/30 bg-[#0B1D16]/90 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-serif font-bold text-[#F4EFE6] flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#D4AF37]" />
            Facing: {direction}
          </span>
          <span className="text-[#D4AF37]/30">|</span>
          <span className="text-[#A3C1AD]">
            Dimensions: <strong className="text-[#F6D985]">{length} ft × {width} ft</strong> ({length * width} sq.ft)
          </span>
        </div>
        <span className="text-xs text-[#A3C1AD]">
          Placed Botanicals: <strong className="text-[#D4AF37]">{plants.length}</strong>
        </span>
      </div>

      {/* Top-Down Architectural Layout Canvas */}
      <div className="relative p-10 rounded-[2.5rem] bg-[#081711] border border-[#D4AF37]/30 shadow-2xl overflow-hidden select-none">
        {/* Cardinal Direction Indicators */}
        <div className="absolute top-3 inset-x-0 text-center text-[10px] font-mono tracking-[0.25em] text-[#D4AF37] uppercase pointer-events-none font-bold">
          ▲ NORTH
        </div>
        <div className="absolute bottom-3 inset-x-0 text-center text-[10px] font-mono tracking-[0.25em] text-[#A3C1AD] uppercase pointer-events-none font-bold">
          ▼ SOUTH
        </div>
        <div className="absolute top-1/2 left-3 -translate-y-1/2 -rotate-90 text-[10px] font-mono tracking-[0.25em] text-[#A3C1AD] uppercase pointer-events-none font-bold">
          ◄ WEST
        </div>
        <div className="absolute top-1/2 right-3 -translate-y-1/2 rotate-90 text-[10px] font-mono tracking-[0.25em] text-[#D4AF37] uppercase pointer-events-none font-bold">
          EAST ►
        </div>

        {/* Room Area Grid Box */}
        <div
          ref={containerRef}
          className="relative w-full aspect-[4/3] max-h-[460px] bg-[#0B1D16]/95 rounded-3xl border border-[#D4AF37]/25 shadow-inner overflow-hidden"
          style={{
            backgroundImage: `
              radial-gradient(#d4af3722 1.5px, transparent 1.5px),
              linear-gradient(to right, #d4af3708 1px, transparent 1px),
              linear-gradient(to bottom, #d4af3708 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px, 48px 48px, 48px 48px',
          }}
        >
          {/* Subtle Vastu Quadrant Guides */}
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#D4AF37]/5 border-b border-l border-[#D4AF37]/25 pointer-events-none p-3 text-[10px] font-mono text-[#F6D985] font-semibold text-right">
            North-East (Ishanya)
          </div>
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[#E07A5F]/5 border-l border-[#E07A5F]/20 pointer-events-none p-3 text-[10px] font-mono text-[#E07A5F] font-semibold text-right flex items-end justify-end">
            South-East (Agni)
          </div>

          {/* Placed Plant Markers */}
          {plants.map((p) => {
            const isSelected = p.id === selectedId;
            const sizePx = 54 * p.scale;

            return (
              <div
                key={p.id}
                onMouseDown={(e) => handleDragPlant(p.id, e)}
                onClick={() => {
                  setSelectedId(p.id);
                  if (onSelectPlantInfo) onSelectPlantInfo(p);
                }}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${sizePx}px`,
                  height: `${sizePx}px`,
                  transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
                }}
                className={`absolute cursor-move select-none transition-shadow rounded-full flex items-center justify-center ${
                  isSelected
                    ? 'ring-4 ring-[#D4AF37] shadow-xl z-30 scale-105'
                    : 'ring-2 ring-[#D4AF37]/40 shadow-md hover:ring-[#D4AF37] z-10'
                }`}
                title={`${p.name} (Drag to position)`}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full rounded-full object-cover pointer-events-none border-2 border-[#D4AF37]/50"
                />

                <div className="absolute -top-1 w-2.5 h-2.5 bg-[#D4AF37] rounded-full border border-[#081711]" />

                <div
                  className="absolute -bottom-6 whitespace-nowrap bg-[#0B1D16] px-2.5 py-0.5 rounded-full text-[10px] text-[#F4EFE6] font-bold shadow-md pointer-events-none border border-[#D4AF37]/35"
                  style={{ transform: `rotate(${-p.rotation}deg)` }}
                >
                  {p.name.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Toolbar for Selected Plant */}
      {selectedPlant && (
        <div className="luxury-card rounded-2xl p-4 border border-[#D4AF37]/30 bg-[#0E281E]/95 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <img
              src={selectedPlant.image}
              alt={selectedPlant.name}
              className="w-12 h-12 rounded-xl object-cover border border-[#D4AF37]/35 shadow-sm"
            />
            <div>
              <h4 className="text-sm font-serif font-bold luxury-gold-text">
                {selectedPlant.name}
              </h4>
              <p className="text-[11px] text-[#A3C1AD] font-mono">
                Rotation: {selectedPlant.rotation}° • Scale: {selectedPlant.scale}x
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleRotate(45)}
              className="p-2.5 rounded-full luxury-btn-secondary text-[#D4AF37] transition"
              title="Rotate 45°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScale(-0.1)}
              className="p-2.5 rounded-full luxury-btn-secondary text-[#F4EFE6] transition"
              title="Scale Down"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScale(0.1)}
              className="p-2.5 rounded-full luxury-btn-secondary text-[#F4EFE6] transition"
              title="Scale Up"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(selectedPlant.id)}
              className="p-2.5 rounded-full bg-[#3B1212] hover:bg-[#521919] text-[#EF4444] border border-[#EF4444]/30 transition duration-200"
              title="Delete Plant"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
