import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Plant } from '../types';
import { PlantCard } from '../components/PlantCard';
import { Heart, Search, ArrowRight, Sprout } from 'lucide-react';

interface SavedPlantsPageProps {
  onNavigate: (tab: string, param?: string) => void;
  onViewPlantDetails: (plant: Plant) => void;
  onAddToGarden: (plant: Plant) => void;
}

export const SavedPlantsPage: React.FC<SavedPlantsPageProps> = ({
  onNavigate,
  onViewPlantDetails,
  onAddToGarden,
}) => {
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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
    const list = savedItems.map((item) => item.plant).filter(Boolean);
    if (!searchTerm) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (p: Plant) =>
        p.name.toLowerCase().includes(q) ||
        p.scientificName.toLowerCase().includes(q) ||
        p.traditionalUses.toLowerCase().includes(q)
    );
  }, [savedItems, searchTerm]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-10 bg-white rounded-[2.5rem] border border-[#E2E8F0] shadow-sm text-center space-y-4">
        <Heart className="w-12 h-12 text-[#EF4444] mx-auto" />
        <h3 className="text-xl font-serif font-bold text-[#0F172A]">Sign in to view your collection</h3>
        <p className="text-xs text-[#64748B]">
          Curate your personal botanical library and seamlessly place them into room layouts.
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="py-2.5 px-6 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs font-bold transition duration-200 shadow-sm"
        >
          Sign In / Demo Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn text-[#0F172A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#2563EB] uppercase block">
            PERSONAL HERBARIUM
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F172A] mt-0.5">
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
            className="w-full px-4 py-2 text-xs rounded-full border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 shadow-xs"
          />
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
            />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-white rounded-[3rem] border border-[#E2E8F0] shadow-sm max-w-lg mx-auto space-y-4">
          <span className="text-4xl block">🌱</span>
          <h3 className="text-2xl font-serif font-bold text-[#0F172A]">
            No saved plants yet
          </h3>
          <p className="text-xs text-[#64748B] max-w-xs mx-auto">
            Browse our botanical gallery to explore traditional remedies and tap the heart icon to save them to your herbarium.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('plants')}
              className="py-3 px-8 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs font-bold tracking-wider transition duration-200 shadow-md shadow-[#F97316]/20"
            >
              Explore Botanical Gallery →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
