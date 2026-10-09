import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Plant } from '../types';
import { PlantCard } from '../components/PlantCard';
import { Heart, Search, ArrowRight, Sprout, Compass } from 'lucide-react';
import {
  isPlantVastuCompatible,
  VASTU_DIRECTIONS,
  getVastuDirectionMetadata
} from '../utils/vastuRules';

interface SavedPlantsPageProps {
  onNavigate: (tab: string, param?: string) => void;
  onViewPlantDetails: (plant: Plant) => void;
  onAddToGarden: (plant: Plant) => void;
  onViewInYourSpace?: (plant: Plant) => void;
}

export const SavedPlantsPage: React.FC<SavedPlantsPageProps> = ({
  onNavigate,
  onViewPlantDetails,
  onAddToGarden,
  onViewInYourSpace,
}) => {
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVastuDirection, setSelectedVastuDirection] = useState<string>('All');

  useEffect(() => {
    async function loadSaved() {
      if (!user) return;
      try {
        const res = await api.getSavedPlants();
        setSavedItems(res);
      } catch (err) {
        console.warn('Error loading saved plants:', err);
      }
    }
    loadSaved();
  }, [user]);

  const filteredPlants = useMemo(() => {
    let list = savedItems.map((item) => item.plant).filter(Boolean);

    if (selectedVastuDirection !== 'All') {
      list = list.filter((p: Plant) => isPlantVastuCompatible(p, selectedVastuDirection));
    }

    if (!searchTerm) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (p: Plant) =>
        p.name.toLowerCase().includes(q) ||
        p.scientificName.toLowerCase().includes(q) ||
        p.traditionalUses.toLowerCase().includes(q)
    );
  }, [savedItems, searchTerm, selectedVastuDirection]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-10 luxury-card bg-[#0B1D16]/95 rounded-[2.5rem] border border-[#D4AF37]/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center space-y-4 text-[#F4EFE6]">
        <Heart className="w-12 h-12 text-[#D4AF37] mx-auto" />
        <h3 className="text-xl font-serif font-bold luxury-gold-text">Sign in to view your collection</h3>
        <p className="text-xs text-[#A3C1AD]">
          Curate your personal botanical library and seamlessly place them into sacred room layouts.
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="py-2.5 px-6 rounded-full luxury-btn-gold text-[#081711] text-xs font-bold transition duration-200 shadow-md"
        >
          Sign In / Demo Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn text-[#F4EFE6]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-6">
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase block">
            PERSONAL HERBARIUM
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold luxury-gold-text mt-0.5">
            Saved Botanical Collection
          </h1>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search saved flora..."
            className="w-full px-4 py-2.5 text-xs rounded-full border border-[#D4AF37]/30 bg-[#0E281E]/80 text-[#F4EFE6] placeholder:text-[#A3C1AD]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Vastu Direction Filter Pills Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0E281E]/60 border border-[#D4AF37]/20">
        <div className="flex items-center gap-2 text-xs font-bold text-[#F6D985]">
          <Compass className="w-4 h-4 text-[#D4AF37]" />
          <span>Vastu Direction Filter:</span>
          {selectedVastuDirection !== 'All' && (
            <span className="text-[11px] font-mono text-[#A3C1AD]">
              ({getVastuDirectionMetadata(selectedVastuDirection).sanskrit})
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedVastuDirection('All')}
            className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
              selectedVastuDirection === 'All'
                ? 'bg-gradient-to-r from-[#F6D985] via-[#E5C158] to-[#D4AF37] text-[#081711] font-bold shadow-md'
                : 'bg-[#0E281E] text-[#A3C1AD] hover:text-[#F6D985] border border-[#D4AF37]/20'
            }`}
          >
            All
          </button>
          {Object.keys(VASTU_DIRECTIONS).map((dirKey) => {
            const isSelected = selectedVastuDirection === dirKey;
            return (
              <button
                key={dirKey}
                type="button"
                onClick={() => setSelectedVastuDirection(dirKey)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#F6D985] via-[#E5C158] to-[#D4AF37] text-[#081711] font-bold shadow-md'
                    : 'bg-[#0E281E] text-[#A3C1AD] hover:text-[#F6D985] border border-[#D4AF37]/20'
                }`}
              >
                {dirKey}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {filteredPlants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlants.map((plant: Plant) => (
            <PlantCard
              key={plant._id}
              plant={plant}
              onViewDetails={onViewPlantDetails}
              onAddToGarden={onAddToGarden}
              onViewInYourSpace={onViewInYourSpace}
            />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center luxury-card bg-[#0B1D16]/90 rounded-[3rem] border border-[#D4AF37]/30 shadow-xl max-w-lg mx-auto space-y-4">
          <span className="text-4xl block">🌱</span>
          <h3 className="text-2xl font-serif font-bold text-[#F4EFE6]">
            No saved plants yet
          </h3>
          <p className="text-xs text-[#A3C1AD] max-w-xs mx-auto">
            Browse our botanical gallery to explore traditional remedies and tap the heart icon to save them to your herbarium.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('plants')}
              className="py-3 px-8 rounded-full luxury-btn-gold text-[#081711] text-xs font-bold tracking-wider transition duration-200 shadow-lg shadow-[#D4AF37]/20"
            >
              Explore Botanical Gallery →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
