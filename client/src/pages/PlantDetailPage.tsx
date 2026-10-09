import React, { useState } from 'react';
import { Plant } from '../types';
import { useAuth } from '../context/AuthContext';
import { Plant3DViewer } from '../components/Plant3DViewer';
import { 
  ArrowLeft, 
  Heart, 
  Plus, 
  Compass, 
  Sun, 
  Droplets, 
  Maximize2, 
  Layers, 
  Sparkles,
  ShieldAlert,
  Camera
} from 'lucide-react';

interface PlantDetailPageProps {
  plant: Plant;
  onBack: () => void;
  onAddToGarden: (plant: Plant) => void;
  onVisualizeInRoom: (plant: Plant) => void;
  onViewInYourSpace?: (plant: Plant) => void;
}

export const PlantDetailPage: React.FC<PlantDetailPageProps> = ({
  plant,
  onBack,
  onAddToGarden,
  onVisualizeInRoom,
  onViewInYourSpace,
}) => {
  const { user, savedPlantIds, toggleSavePlant } = useAuth();
  const isSaved = savedPlantIds.has(plant._id);
  const [activeMediaTab, setActiveMediaTab] = useState<'3d' | 'photo'>('3d');

  const handleToggleSave = async () => {
    if (!user) {
      alert('Sign in to save this botanical specimen to your herbarium.');
      return;
    }
    await toggleSavePlant(plant._id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn text-[#F4EFE6]">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#A3C1AD] hover:text-[#F6D985] bg-[#0E281E]/80 hover:bg-[#133528] px-4 py-2 rounded-full border border-[#D4AF37]/30 shadow-xs transition duration-200"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-[#D4AF37]" />
        Back to Botanical Gallery
      </button>

      {/* Main Digital Herbarium Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left: Large Immersive Plant Specimen / 3D Model */}
        <div className="lg:col-span-6 space-y-4">
          <div className="luxury-card rounded-[2.5rem] p-3 border border-[#D4AF37]/30 shadow-xl relative overflow-hidden bg-[#0B1D16]/90 backdrop-blur-xl">
            {activeMediaTab === '3d' ? (
              <div className="rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#081711] to-[#0E281E] border border-[#D4AF37]/15">
                <Plant3DViewer
                  modelConfig={plant.model3D}
                  plantName={plant.name}
                  height="480px"
                  autoRotate={true}
                />
              </div>
            ) : (
              <div className="rounded-[2rem] overflow-hidden h-[480px] bg-[#081711] border border-[#D4AF37]/15">
                <img
                  src={plant.image}
                  alt={plant.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Switcher Toggle: 3D Model vs Botanical Photography */}
            <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none">
              <div className="bg-[#0B1D16]/95 backdrop-blur-md rounded-full p-1 border border-[#D4AF37]/35 shadow-lg flex gap-1 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('3d')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition duration-200 ${
                    activeMediaTab === '3d'
                      ? 'luxury-btn-gold text-[#081711] shadow-md'
                      : 'text-[#A3C1AD] hover:text-[#F4EFE6]'
                  }`}
                >
                  3D Specimen
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('photo')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition duration-200 ${
                    activeMediaTab === 'photo'
                      ? 'luxury-btn-gold text-[#081711] shadow-md'
                      : 'text-[#A3C1AD] hover:text-[#F4EFE6]'
                  }`}
                >
                  Photography
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Editorial Plant Information Herbarium Sheet */}
        <div className="lg:col-span-6 space-y-6">
          {/* Identity Header */}
          <div className="space-y-2 border-b border-[#D4AF37]/25 pb-6">
            <div className="flex items-center justify-between">
              <span className="bg-[#D4AF37]/15 text-[#F6D985] border border-[#D4AF37]/35 text-[10px] font-bold uppercase tracking-[0.2em] px-3.5 py-1 rounded-full shadow-2xs">
                {plant.ayushSystem}
              </span>

              <button
                type="button"
                onClick={handleToggleSave}
                className="p-2.5 rounded-full bg-[#0E281E]/90 border border-[#D4AF37]/30 hover:border-[#E07A5F] text-[#A3C1AD] hover:text-[#E07A5F] shadow-sm transition duration-200"
                title={isSaved ? 'Remove from saved' : 'Save to herbarium'}
              >
                <Heart
                  className={`w-4 h-4 ${
                    isSaved ? 'text-[#E07A5F] fill-[#E07A5F]' : ''
                  }`}
                />
              </button>
            </div>

            <h1 className="text-4xl sm:text-5xl font-serif font-bold luxury-gold-text tracking-tight uppercase">
              {plant.name}
            </h1>

            <p className="text-sm font-mono italic text-[#A3C1AD]">
              {plant.scientificName} {plant.family && `• ${plant.family}`}
            </p>
          </div>

          {/* Prominent Action Buttons: “Place in 3D Garden” and “View in Your Space” */}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => onAddToGarden(plant)}
              className="flex-1 py-3.5 px-6 rounded-full luxury-btn-copper text-white text-xs font-bold tracking-wider transition-all duration-200 shadow-md flex items-center justify-center gap-2"
            >
              <span>🌱 Place in 3D Garden</span>
            </button>

            <button
              type="button"
              onClick={() => (onViewInYourSpace ? onViewInYourSpace(plant) : onVisualizeInRoom(plant))}
              className="py-3.5 px-6 rounded-full luxury-btn-gold text-[#081711] text-xs font-bold tracking-wider transition-all duration-200 shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-[#081711] animate-pulse" />
              <span>View in Your Space (AR)</span>
            </button>
          </div>

          {/* Description */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#D4AF37]">
              Botanical Description
            </span>
            <p className="text-xs sm:text-sm text-[#F4EFE6]/90 leading-relaxed font-sans">
              {plant.description}
            </p>
          </div>

          {/* Traditional Uses */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#D4AF37]">
              Traditional Uses
            </span>
            <div className="p-4 rounded-2xl bg-[#0E281E]/80 border border-[#D4AF37]/25 text-xs text-[#F4EFE6]/90 leading-relaxed shadow-sm">
              {plant.traditionalUses}
            </div>
          </div>

          {/* Plant Parts Used */}
          {plant.plantPartsUsed && plant.plantPartsUsed.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#D4AF37]">
                Plant Parts Used
              </span>
              <div className="flex flex-wrap gap-1.5">
                {plant.plantPartsUsed.map((part, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full text-xs bg-[#0B1D16] border border-[#D4AF37]/30 text-[#F4EFE6] font-medium shadow-2xs"
                  >
                    {part}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Growing Conditions Matrix: Sunlight, Water, Space, Maintenance */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs">
            <div className="p-3 rounded-2xl bg-[#0E281E]/80 border border-[#D4AF37]/25 shadow-xs">
              <span className="text-[10px] text-[#A3C1AD] uppercase font-bold block">Sunlight</span>
              <strong className="text-[#F6D985] mt-0.5 block">{plant.sunlight.split(' ')[0]}</strong>
            </div>

            <div className="p-3 rounded-2xl bg-[#0E281E]/80 border border-[#D4AF37]/25 shadow-xs">
              <span className="text-[10px] text-[#A3C1AD] uppercase font-bold block">Water</span>
              <strong className="text-[#F6D985] mt-0.5 block">{plant.watering.split(' ')[0]}</strong>
            </div>

            <div className="p-3 rounded-2xl bg-[#0E281E]/80 border border-[#D4AF37]/25 shadow-xs">
              <span className="text-[10px] text-[#A3C1AD] uppercase font-bold block">Space</span>
              <strong className="text-[#F6D985] mt-0.5 block">{plant.spaceRequired.split(' ')[0]}</strong>
            </div>

            <div className="p-3 rounded-2xl bg-[#0E281E]/80 border border-[#D4AF37]/25 shadow-xs">
              <span className="text-[10px] text-[#A3C1AD] uppercase font-bold block">Maintenance</span>
              <strong className="text-[#F6D985] mt-0.5 block">{plant.maintenanceLevel}</strong>
            </div>
          </div>

          {/* Vastu Guidance */}
          <div className="p-4 rounded-2xl bg-[#0E281E]/80 border border-[#D4AF37]/30 shadow-xs space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F6D985] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
              Vastu Guidance: {plant.vastuDirections.join(', ')}
            </span>
            <p className="text-xs text-[#A3C1AD] leading-relaxed">
              {plant.vastuExplanation}
            </p>
          </div>

          {/* Small Mandatory Disclaimer per prompt */}
          <div className="text-[11px] text-[#A3C1AD]/70 italic pt-2 border-t border-[#D4AF37]/20">
            Traditional and educational information. Not a substitute for professional medical advice.
          </div>
        </div>
      </div>
    </div>
  );
};
