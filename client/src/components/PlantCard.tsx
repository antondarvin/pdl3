import React from 'react';
import { Plant } from '../types';
import { useAuth } from '../context/AuthContext';
import { Heart, Compass, ArrowRight, Plus, Camera, Sparkles } from 'lucide-react';

interface PlantCardProps {
  plant: Plant;
  onViewDetails: (plant: Plant) => void;
  onAddToGarden?: (plant: Plant) => void;
  onViewInYourSpace?: (plant: Plant) => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({
  plant,
  onViewDetails,
  onAddToGarden,
  onViewInYourSpace,
}) => {
  const { user, savedPlantIds, toggleSavePlant } = useAuth();
  const isSaved = savedPlantIds.has(plant._id);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert('Sign in to save botanicals to your personal sanctuary collection.');
      return;
    }
    await toggleSavePlant(plant._id);
  };

  return (
    <div
      onClick={() => onViewDetails(plant)}
      className="group glass-card hover-lift rounded-[2rem] overflow-hidden border border-[#D4AF37]/25 bg-[#0E281E]/75 backdrop-blur-xl flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-xl hover:shadow-[0_20px_45px_rgba(0,0,0,0.7)] hover:border-[#D4AF37]/50"
    >
      <div>
        {/* Large Botanical Image Header */}
        <div className="relative h-60 w-full overflow-hidden bg-[#071610]">
          <img
            src={plant.image}
            alt={plant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E281E] via-transparent to-black/25" />

          {/* AYUSH Category Pill */}
          <div className="absolute top-3.5 left-3.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full text-[#F6D985] bg-[#071610]/85 border border-[#D4AF37]/35 shadow-md backdrop-blur-md">
              {plant.ayushSystem}
            </span>
          </div>

          {/* Minimal Save / Heart Button */}
          <button
            type="button"
            onClick={handleToggleSave}
            title={isSaved ? 'Remove from saved' : 'Save to herbarium'}
            className="absolute top-3.5 right-3.5 p-2 rounded-full bg-[#071610]/80 backdrop-blur-md hover:bg-[#0E281E] text-[#A3C1AD] hover:text-[#EF4444] border border-[#D4AF37]/20 transition shadow-sm"
          >
            <Heart
              className={`w-3.5 h-3.5 transition ${
                isSaved ? 'text-[#EF4444] fill-[#EF4444]' : ''
              }`}
            />
          </button>

          {/* Vastu & Care Badges on Image Bottom */}
          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-[#F4EFE6] text-[11px]">
            <span className="inline-flex items-center gap-1 bg-[#071610]/85 backdrop-blur-md px-2.5 py-0.5 rounded-full font-medium border border-[#D4AF37]/25 text-[#E8E2D5]">
              <Compass className="w-3 h-3 text-[#E08A3C]" />
              {plant.vastuDirections[0]}
            </span>
            <span className="bg-[#071610]/85 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] text-[#A3C1AD] font-semibold border border-[#D4AF37]/25">
              {plant.maintenanceLevel} Care
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-3">
          <div>
            <h3 className="text-xl font-serif font-bold text-[#F4EFE6] group-hover:text-[#F6D985] transition-colors line-clamp-1">
              {plant.name}
            </h3>
            <p className="text-xs font-mono italic text-[#A3C1AD] truncate mt-0.5">
              {plant.scientificName}
            </p>
          </div>

          <p className="text-xs text-[#A3C1AD] line-clamp-2 leading-relaxed">
            {plant.description}
          </p>

          {/* Traditional Use Indicator Badge */}
          <div className="pt-2">
            <div className="p-2.5 rounded-xl bg-[#081A13]/90 border border-[#D4AF37]/20 text-[11px] text-[#E8E2D5] shadow-inner">
              <span className="font-bold text-[#F6D985] uppercase text-[9px] tracking-wider block">
                Traditional Classical Use:
              </span>
              <span className="line-clamp-1 mt-0.5 text-[#C9DDD0]">{plant.traditionalUses}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-6 pt-0 flex items-center justify-between border-t border-[#D4AF37]/20 mt-2 gap-2">
        <span className="text-xs font-bold text-[#F6D985] group-hover:text-[#FFF0B8] flex items-center gap-1 transition">
          Botanical Lore <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
        </span>

        <div className="flex items-center gap-2">
          {onViewInYourSpace && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewInYourSpace(plant);
              }}
              title="View in Your Space (AR)"
              className="py-1.5 px-3 rounded-full bg-[#123628] hover:bg-[#1B4D3A] text-[#F6D985] hover:text-white transition duration-200 text-xs font-bold border border-[#D4AF37]/40 hover:border-[#D4AF37] flex items-center gap-1.5 shadow-sm"
            >
              <Camera className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>AR</span>
            </button>
          )}

          {onAddToGarden && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToGarden(plant);
              }}
              title="Add to Sanctuary Plan"
              className="p-2 rounded-full luxury-btn-gold text-[#081711] transition-all duration-200 shadow-md hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
