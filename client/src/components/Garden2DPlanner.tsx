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
    <div className="space-y-6">
      {/* Dimension & Direction Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 glass-card rounded-2xl border border-slate-200 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-serif font-bold text-[#0F172A] flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#F97316]" />
            Facing: {direction}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-[#64748B]">
            Dimensions: <strong className="text-[#0F172A]">{length} ft × {width} ft</strong> ({length * width} sq.ft)
          </span>
        </div>
        <span className="text-xs text-[#64748B]">
          Placed Botanicals: <strong className="text-[#2563EB]">{plants.length}</strong>
        </span>
      </div>

      {/* Top-Down Architectural Layout Canvas */}
      <div className="relative p-10 rounded-[2.5rem] bg-slate-100 border border-slate-200 shadow-inner overflow-hidden select-none">
        {/* Cardinal Direction Indicators */}
        <div className="absolute top-3 inset-x-0 text-center text-[10px] font-mono tracking-[0.25em] text-[#2563EB] uppercase pointer-events-none font-bold">
          ▲ NORTH
        </div>
        <div className="absolute bottom-3 inset-x-0 text-center text-[10px] font-mono tracking-[0.25em] text-[#64748B] uppercase pointer-events-none font-bold">
          ▼ SOUTH
        </div>
        <div className="absolute top-1/2 left-3 -translate-y-1/2 -rotate-90 text-[10px] font-mono tracking-[0.25em] text-[#64748B] uppercase pointer-events-none font-bold">
          ◄ WEST
        </div>
        <div className="absolute top-1/2 right-3 -translate-y-1/2 rotate-90 text-[10px] font-mono tracking-[0.25em] text-[#2563EB] uppercase pointer-events-none font-bold">
          EAST ►
        </div>

        {/* Room Area Grid Box */}
        <div
          ref={containerRef}
          className="relative w-full aspect-[4/3] max-h-[460px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
          style={{
            backgroundImage: `
              radial-gradient(#2563eb18 1.5px, transparent 1.5px),
              linear-gradient(to right, #00000005 1px, transparent 1px),
              linear-gradient(to bottom, #00000005 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px, 48px 48px, 48px 48px',
          }}
        >
          {/* Subtle Vastu Quadrant Guides */}
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500/5 border-b border-l border-blue-500/20 pointer-events-none p-3 text-[10px] font-mono text-[#2563EB] font-semibold text-right">
            North-East (Ishanya)
          </div>
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-slate-500/5 border-l border-slate-500/15 pointer-events-none p-3 text-[10px] font-mono text-[#64748B] font-semibold text-right flex items-end justify-end">
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
                    ? 'ring-4 ring-[#2563EB] shadow-xl z-30 scale-105'
                    : 'ring-2 ring-slate-300 shadow-md hover:ring-[#2563EB] z-10'
                }`}
                title={`${p.name} (Drag to position)`}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full rounded-full object-cover pointer-events-none border-2 border-white"
                />

                <div className="absolute -top-1 w-2.5 h-2.5 bg-[#2563EB] rounded-full border border-white" />

                <div
                  className="absolute -bottom-6 whitespace-nowrap glass-card px-2 py-0.5 rounded-full text-[10px] text-[#0F172A] font-bold shadow-xs pointer-events-none border border-slate-200"
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
        <div className="glass-card rounded-2xl p-4 border border-slate-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <img
              src={selectedPlant.image}
              alt={selectedPlant.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
            />
            <div>
              <h4 className="text-sm font-serif font-bold text-[#0F172A]">
                {selectedPlant.name}
              </h4>
              <p className="text-[11px] text-[#64748B] font-mono">
                Rotation: {selectedPlant.rotation}° • Scale: {selectedPlant.scale}x
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleRotate(45)}
              className="p-2 rounded-full glass-card hover:bg-blue-50 text-[#2563EB] transition border border-slate-200"
              title="Rotate 45°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScale(-0.1)}
              className="p-2 rounded-full glass-card hover:bg-slate-50 text-[#0F172A] hover:text-[#2563EB] transition border border-slate-200"
              title="Scale Down"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScale(0.1)}
              className="p-2 rounded-full glass-card hover:bg-slate-50 text-[#0F172A] hover:text-[#2563EB] transition border border-slate-200"
              title="Scale Up"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(selectedPlant.id)}
              className="p-2 rounded-full hover:bg-red-50 text-[#EF4444] transition duration-200"
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
