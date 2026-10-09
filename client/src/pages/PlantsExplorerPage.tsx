import React, { useState, useMemo } from 'react';
import { Plant } from '../types';
import { PlantCard } from '../components/PlantCard';
import { Search, RotateCcw, ArrowUpDown, Info } from 'lucide-react';

interface PlantsExplorerPageProps {
  plants: Plant[];
  onViewPlantDetails: (plant: Plant) => void;
  onAddToGarden: (plant: Plant) => void;
}

export const PlantsExplorerPage: React.FC<PlantsExplorerPageProps> = ({
  plants,
  onViewPlantDetails,
  onAddToGarden,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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

      return true;
    });

    if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [plants, searchTerm, selectedCategory, selectedSunlight, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn text-[#0F172A]">
      
      {/* Editorial Header */}
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#2563EB] uppercase block">
          DIGITAL BOTANICAL GALLERY
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif text-[#0F172A] tracking-tight">
          AYUSH Herbal Compendium
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          Explore botanical taxonomy, traditional therapeutic uses, and Vastu orientation guidelines for classical Indian medicinal plants.
        </p>
      </div>

      {/* Large Floating Search Field (per requirement: “⌕ Search medicinal plants...”) */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="relative bg-white rounded-full shadow-sm border border-[#E2E8F0] p-1.5 flex items-center transition focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/20">
          <span className="pl-4 text-[#2563EB] text-lg font-bold">⌕</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search medicinal plants..."
            className="w-full px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="pr-4 text-xs text-[#64748B] hover:text-[#EF4444] transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Elegant Filter Pills: All, Ayurveda, Siddha, Unani, Yoga, Homeopathy */}
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
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-white text-[#64748B] hover:text-[#2563EB] hover:bg-[#F8FAFC] border border-[#E2E8F0]'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count & Sort */}
      <div className="flex items-center justify-between text-xs text-[#64748B] px-2 pt-2 border-t border-[#E2E8F0]">
        <span>
          Showing <strong className="text-[#0F172A]">{filteredPlants.length}</strong> botanical specimens
        </span>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[#0F172A] focus:outline-none cursor-pointer"
          >
            <option value="default">Default Arrangement</option>
            <option value="name-asc">Alphabetical (A → Z)</option>
            <option value="name-desc">Alphabetical (Z → A)</option>
          </select>
        </div>
      </div>

      {/* Responsive Botanical Grid (2 columns on mobile, 3-4 on desktop) */}
      {filteredPlants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlants.map((plant) => (
            <PlantCard
              key={plant._id}
              plant={plant}
              onViewDetails={onViewPlantDetails}
              onAddToGarden={onAddToGarden}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-[2.5rem] border border-[#E2E8F0] shadow-xs space-y-3 max-w-lg mx-auto">
          <span className="text-3xl block">🌱</span>
          <h3 className="text-lg font-serif font-bold text-[#0F172A]">No Plants Found</h3>
          <p className="text-xs text-[#64748B] max-w-xs mx-auto">
            Try adjusting your search query or reset your selected category filter.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
            }}
            className="px-5 py-2 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs font-semibold shadow-xs transition duration-200"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
