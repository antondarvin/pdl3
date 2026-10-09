import React from 'react';
import { Plant } from '../types';
import { useAuth } from '../context/AuthContext';
import { Heart, Sun, Droplets, Compass, ArrowRight, Plus } from 'lucide-react';

interface PlantCardProps {
  plant: Plant;
  onViewDetails: (plant: Plant) => void;
  onAddToGarden?: (plant: Plant) => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({
  plant,
  onViewDetails,
  onAddToGarden,
}) => {
  const { user, savedPlantIds, toggleSavePlant } = useAuth();
  const isSaved = savedPlantIds.has(plant._id);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert('Sign in to save plants to your personal herbarium collection.');
      return;
    }
    await toggleSavePlant(plant._id);
  };

  return (
    <div
      onClick={() => onViewDetails(plant)}
      className="group glass-card hover-lift rounded-[2rem] overflow-hidden border border-slate-200 bg-white flex flex-col justify-between cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:border-blue-300"
    >
      <div>
        {/* Large Botanical Image Header */}
        <div className="relative h-60 w-full overflow-hidden bg-slate-100">
          <img
            src={plant.image}
            alt={plant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15" />

          {/* AYUSH Category Pill */}
          <div className="absolute top-3.5 left-3.5">
            <span className="glass-card text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full text-[#2563EB] bg-white/95 border border-slate-200 shadow-xs">
              {plant.ayushSystem}
            </span>
          </div>

          {/* Minimal Save / Heart Button */}
          <button
            type="button"
            onClick={handleToggleSave}
            title={isSaved ? 'Remove from saved' : 'Save to herbarium'}
            className="absolute top-3.5 right-3.5 p-2 rounded-full glass-card hover:bg-white text-slate-700 transition shadow-xs"
          >
            <Heart
              className={`w-3.5 h-3.5 transition ${
                isSaved ? 'text-[#EF4444] fill-[#EF4444]' : 'text-slate-500 hover:text-[#EF4444]'
              }`}
            />
          </button>

          {/* Vastu & Care Badges on Image Bottom */}
          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-[11px]">
            <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full font-medium border border-white/20">
              <Compass className="w-3 h-3 text-[#F97316]" />
              {plant.vastuDirections[0]}
            </span>
            <span className="bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] text-slate-200 font-semibold border border-white/20">
              {plant.maintenanceLevel} Care
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-3">
          <div>
            <h3 className="text-xl font-serif font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors line-clamp-1">
              {plant.name}
            </h3>
            <p className="text-xs font-mono italic text-[#64748B] truncate mt-0.5">
              {plant.scientificName}
            </p>
          </div>

          <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
            {plant.description}
          </p>

          {/* Traditional Use Indicator Badge */}
          <div className="pt-2">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-[#0F172A]">
              <span className="font-bold text-[#2563EB] uppercase text-[9px] tracking-wider block">
                Traditional Use:
              </span>
              <span className="line-clamp-1 mt-0.5">{plant.traditionalUses}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
        <span className="text-xs font-bold text-[#2563EB] group-hover:text-blue-700 flex items-center gap-1 transition">
          View Herbarium <ArrowRight className="w-3.5 h-3.5 text-[#2563EB] group-hover:translate-x-1 transition-transform" />
        </span>

        {onAddToGarden && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToGarden(plant);
            }}
            title="Add to Garden Planner"
            className="p-2 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-all duration-200 shadow-sm hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
