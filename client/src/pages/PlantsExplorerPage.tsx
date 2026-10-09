import React, { useState, useMemo } from 'react';
import { Plant } from '../types';
import { PlantCard } from '../components/PlantCard';
import { Search, Compass } from 'lucide-react';
import {
  isPlantVastuCompatible,
  VASTU_DIRECTIONS,
  getVastuDirectionMetadata
} from '../utils/vastuRules';

interface PlantsExplorerPageProps {
  plants: Plant[];
  onViewPlantDetails: (plant: Plant) => void;
  onAddToGarden: (plant: Plant) => void;
  onViewInYourSpace?: (plant: Plant) => void;
}

export const PlantsExplorerPage: React.FC<PlantsExplorerPageProps> = ({
  plants,
  onViewPlantDetails,
  onAddToGarden,
  onViewInYourSpace,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedVastuDirection, setSelectedVastuDirection] = useState<string>('All');
  const [selectedSunlight, setSelectedSunlight] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('default');

  // Exact categories matching user requirement: All, Ayurveda, Siddha, Unani, Yoga, Homeopathy
  const filterPills = [
    { label: 'All', value: 'All' },
    { label: 'Ayurveda', value: 'Ayurveda' },
    { label: 'Siddha', value: 'Siddha' },
    { label: 'Unani', value: 'Unani' },
    { label: 'Yoga', value: 'Yoga & Naturopathy' },
    { label: 'Homeopathy', value: 'Homeopathy' },
  ];

  const filteredPlants = useMemo(() => {
    let result = plants.filter((p) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.scientificName.toLowerCase().includes(q) ||
          p.traditionalUses.toLowerCase().includes(q) ||
          p.ayushSystem.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedCategory !== 'All' && p.ayushSystem !== selectedCategory) {
        return false;
      }

      if (selectedSunlight !== 'All') {
        if (!p.sunlight.toLowerCase().includes(selectedSunlight.toLowerCase())) return false;
      }

      if (selectedVastuDirection !== 'All') {
        if (!isPlantVastuCompatible(p, selectedVastuDirection)) return false;
      }

      return true;
    });

    if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [plants, searchTerm, selectedCategory, selectedVastuDirection, selectedSunlight, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn text-[#F4EFE6]">
      
      {/* Editorial Header */}
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#F6D985] uppercase block">
          DIGITAL ROYAL HERBARIUM
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif text-[#F4EFE6] tracking-tight">
          AYUSH Herbal Compendium
        </h1>
        <p className="text-xs sm:text-sm text-[#A3C1AD] leading-relaxed">
          Explore classical botanical taxonomy, traditional Ayurvedic therapeutic preparations, and Vastu spatial orientation matrices for sacred Indian flora.
        </p>
      </div>

      {/* Large Floating Search Field */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="relative bg-[#0E281E]/90 backdrop-blur-xl rounded-full shadow-xl border border-[#D4AF37]/35 p-1.5 flex items-center transition focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/25">
          <span className="pl-4 text-[#D4AF37] text-lg font-bold">⌕</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search medicinal plants by name, botanical genus, or therapeutic use..."
            className="w-full px-3 py-2 text-sm text-[#F4EFE6] placeholder:text-[#A3C1AD]/70 bg-transparent focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="pr-4 text-xs text-[#A3C1AD] hover:text-[#EF4444] transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Elegant AYUSH Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {filterPills.map((pill) => {
            const isSelected = selectedCategory === pill.value;
            return (
              <button
                key={pill.label}
                type="button"
                onClick={() => setSelectedCategory(pill.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#F6D985] via-[#E5C158] to-[#D4AF37] text-[#081711] font-bold shadow-md'
                    : 'bg-[#0E281E]/75 text-[#A3C1AD] hover:text-[#F6D985] hover:bg-[#133629] border border-[#D4AF37]/25'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Dedicated Vastu Direction Filter Bar */}
        <div className="pt-3 flex flex-col items-center gap-2 border-t border-[#D4AF37]/20">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F6D985]">
            <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Vastu Orientation Filter:</span>
            {selectedVastuDirection !== 'All' && (
              <span className="text-[11px] font-mono text-[#A3C1AD]">
                ({getVastuDirectionMetadata(selectedVastuDirection).sanskrit} • {getVastuDirectionMetadata(selectedVastuDirection).energyType})
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedVastuDirection('All')}
              className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                selectedVastuDirection === 'All'
                  ? 'bg-gradient-to-r from-[#F6D985] via-[#E5C158] to-[#D4AF37] text-[#081711] font-bold shadow-md'
                  : 'bg-[#0E281E]/75 text-[#A3C1AD] hover:text-[#F6D985] hover:bg-[#133629] border border-[#D4AF37]/25'
              }`}
            >
              All Directions
            </button>
            {Object.keys(VASTU_DIRECTIONS).map((dirKey) => {
              const isSelected = selectedVastuDirection === dirKey;
              return (
                <button
                  key={dirKey}
                  type="button"
                  onClick={() => setSelectedVastuDirection(dirKey)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#F6D985] via-[#E5C158] to-[#D4AF37] text-[#081711] font-bold shadow-md'
                      : 'bg-[#0E281E]/75 text-[#A3C1AD] hover:text-[#F6D985] hover:bg-[#133629] border border-[#D4AF37]/25'
                  }`}
                >
                  {dirKey}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Count & Sort */}
      <div className="flex items-center justify-between text-xs text-[#A3C1AD] px-2 pt-2 border-t border-[#D4AF37]/20">
        <span>
          Showing <strong className="text-[#F6D985]">{filteredPlants.length}</strong> botanical specimens
        </span>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#0E281E] border border-[#D4AF37]/30 text-xs font-semibold text-[#F4EFE6] rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="default" className="bg-[#081711] text-[#F4EFE6]">Default Arrangement</option>
            <option value="name-asc" className="bg-[#081711] text-[#F4EFE6]">Alphabetical (A → Z)</option>
            <option value="name-desc" className="bg-[#081711] text-[#F4EFE6]">Alphabetical (Z → A)</option>
          </select>
        </div>
      </div>

      {/* Responsive Botanical Grid */}
      {filteredPlants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlants.map((plant) => (
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
        <div className="py-20 text-center bg-[#0E281E]/80 rounded-[2.5rem] border border-[#D4AF37]/25 shadow-xl space-y-3 max-w-lg mx-auto">
          <span className="text-3xl block">🌱</span>
          <h3 className="text-lg font-serif font-bold text-[#F4EFE6]">No Botanicals Found</h3>
          <p className="text-xs text-[#A3C1AD] max-w-xs mx-auto">
            Try adjusting your search query or reset your selected tradition filter.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
            }}
            className="px-5 py-2 rounded-full luxury-btn-gold text-[#081711] text-xs font-bold shadow-md transition duration-200"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
