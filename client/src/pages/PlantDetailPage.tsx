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
}

export const PlantDetailPage: React.FC<PlantDetailPageProps> = ({
  plant,
  onBack,
  onAddToGarden,
  onVisualizeInRoom,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn text-[#0F172A]">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#2563EB] bg-white hover:bg-[#F8FAFC] px-4 py-2 rounded-full border border-[#E2E8F0] shadow-xs transition duration-200"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Botanical Gallery
      </button>

      {/* Main Digital Herbarium Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left: Large Immersive Plant Specimen / 3D Model */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-[2.5rem] p-3 border border-[#E2E8F0] shadow-sm relative overflow-hidden">
            {activeMediaTab === '3d' ? (
              <div className="rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#F1F5F9] to-[#F8FAFC]">
                <Plant3DViewer
                  modelConfig={plant.model3D}
                  plantName={plant.name}
                  height="480px"
                  autoRotate={true}
                />
              </div>
            ) : (
              <div className="rounded-[2rem] overflow-hidden h-[480px] bg-[#F1F5F9]">
                <img
                  src={plant.image}
                  alt={plant.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Switcher Toggle: 3D Model vs Botanical Photography */}
            <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none">
              <div className="bg-white/90 backdrop-blur-md rounded-full p-1 border border-[#E2E8F0] shadow-md flex gap-1 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('3d')}
                  className={`px-4 py-1 rounded-full text-xs font-semibold transition duration-200 ${
                    activeMediaTab === '3d'
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  3D Specimen
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('photo')}
                  className={`px-4 py-1 rounded-full text-xs font-semibold transition duration-200 ${
                    activeMediaTab === 'photo'
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
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
          <div className="space-y-2 border-b border-[#E2E8F0] pb-6">
            <div className="flex items-center justify-between">
              <span className="bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-[10px] font-bold uppercase tracking-[0.2em] px-3.5 py-1 rounded-full">
                {plant.ayushSystem}
              </span>

              <button
                type="button"
                onClick={handleToggleSave}
                className="p-2 rounded-full bg-white border border-[#E2E8F0] hover:border-[#EF4444] text-[#64748B] hover:text-[#EF4444] shadow-xs transition duration-200"
                title={isSaved ? 'Remove from saved' : 'Save to herbarium'}
              >
                <Heart
                  className={`w-4 h-4 ${
                    isSaved ? 'text-[#EF4444] fill-[#EF4444]' : ''
                  }`}
                />
              </button>
            </div>

            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#0F172A] tracking-tight uppercase">
              {plant.name}
            </h1>

            <p className="text-sm font-mono italic text-[#64748B]">
              {plant.scientificName} {plant.family && `• ${plant.family}`}
            </p>
          </div>

          {/* Prominent Action Buttons: “Place in 3D Garden” and “View in My Space” */}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => onAddToGarden(plant)}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs font-bold tracking-wider transition-all duration-200 shadow-md shadow-[#F97316]/20 flex items-center justify-center gap-2"
            >
              <span>🌱 Place in 3D Garden</span>
            </button>

            <button
              type="button"
              onClick={() => onVisualizeInRoom(plant)}
              className="py-3.5 px-6 rounded-full bg-white hover:bg-[#F8FAFC] text-[#2563EB] text-xs font-bold tracking-wider transition-all duration-200 border border-[#2563EB]/30 hover:border-[#2563EB] shadow-xs flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-[#2563EB]" />
              <span>◉ View in My Space</span>
            </button>
          </div>

          {/* Description */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#2563EB]">
              Botanical Description
            </span>
            <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed">
              {plant.description}
            </p>
          </div>

          {/* Traditional Uses */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#2563EB]">
              Traditional Uses
            </span>
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] leading-relaxed">
              {plant.traditionalUses}
            </div>
          </div>

          {/* Plant Parts Used */}
          {plant.plantPartsUsed && plant.plantPartsUsed.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#2563EB]">
                Plant Parts Used
              </span>
              <div className="flex flex-wrap gap-1.5">
                {plant.plantPartsUsed.map((part, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full text-xs bg-white border border-[#E2E8F0] text-[#0F172A] font-medium shadow-2xs"
                  >
                    {part}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Growing Conditions Matrix: Sunlight, Water, Space, Maintenance */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs">
            <div className="p-3 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">Sunlight</span>
              <strong className="text-[#0F172A] mt-0.5 block">{plant.sunlight.split(' ')[0]}</strong>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">Water</span>
              <strong className="text-[#0F172A] mt-0.5 block">{plant.watering.split(' ')[0]}</strong>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">Space</span>
              <strong className="text-[#0F172A] mt-0.5 block">{plant.spaceRequired.split(' ')[0]}</strong>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">Maintenance</span>
              <strong className="text-[#0F172A] mt-0.5 block">{plant.maintenanceLevel}</strong>
            </div>
          </div>

          {/* Vastu Guidance */}
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#F97316]" />
              Vastu Guidance: {plant.vastuDirections.join(', ')}
            </span>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {plant.vastuExplanation}
            </p>
          </div>

          {/* Small Mandatory Disclaimer per prompt: “Traditional and educational information. Not a substitute for professional medical advice.” */}
          <div className="text-[11px] text-[#64748B] italic pt-1 border-t border-[#E2E8F0]">
            Traditional and educational information. Not a substitute for professional medical advice.
          </div>
        </div>
      </div>
    </div>
  );
};
