import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserStats, UserActivity, Garden } from '../types';
import { 
  Compass, 
  ArrowRight, 
  Ruler, 
  Layers, 
  Clock, 
  Sparkles,
  MoveRight
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);

  useEffect(() => {
    async function loadWorkspaceData() {
      try {
        const [gList, sData, aData] = await Promise.all([
          api.getGardens().catch(() => []),
          api.getStats().catch(() => null),
          api.getActivity().catch(() => [])
        ]);
        setGardens(gList);
        setStats(sData);
        setActivities(aData);
      } catch (err) {
        console.warn('Dashboard load error:', err);
      }
    }
    loadWorkspaceData();
  }, []);

  const latestGarden = gardens[0] || {
    gardenName: 'My Living Room Garden',
    roomType: 'Living Room',
    length: 12,
    width: 8,
    direction: 'North-East',
    plants: Array(6).fill(null),
    updatedAt: new Date().toISOString()
  };

  const areaSqFt = latestGarden.length * latestGarden.width;

  const ayushPills = [
    'Ayurveda',
    'Siddha',
    'Unani',
    'Yoga & Naturopathy',
    'Homeopathy'
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fadeIn text-[#F4EFE6]">
      {/* Header */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase block">
          PERSONAL HERBARIUM WORKSPACE
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold luxury-gold-text tracking-tight">
          Good morning, {user?.name.split(' ')[0] || 'Botanist'} 🌿
        </h1>
        <p className="text-sm text-[#A3C1AD]">
          Continue nurturing and orchestrating your sacred botanical sanctuary.
        </p>
      </div>

      {/* Main Section: “Your Herbal Space” */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif font-bold text-[#F4EFE6]">
            Your Herbal Space
          </h2>
          <button
            onClick={() => onNavigate('gardens')}
            className="text-xs font-semibold text-[#D4AF37] hover:text-[#F6D985] transition flex items-center gap-1"
          >
            All saved spaces ({gardens.length}) →
          </button>
        </div>

        {/* Large Botanical Visualization Canvas */}
        <div className="relative rounded-[2.5rem] overflow-hidden luxury-card bg-[#0B1D16]/90 border border-[#D4AF37]/30 p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.5)] min-h-[380px] flex flex-col justify-between">
          {/* Background Subtle Room Canvas Graphic */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#133E2B]/50 via-[#0B1D16] to-[#081711] opacity-90" />
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Status Tags */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#D4AF37] uppercase block">
                ACTIVE SANCTUARY
              </span>
              <h3 className="text-2xl font-serif font-bold text-[#F4EFE6] mt-0.5">
                {latestGarden.gardenName}
              </h3>
            </div>

            <div className="bg-[#0E281E]/90 rounded-full px-4 py-1.5 border border-[#D4AF37]/30 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-xs font-bold text-[#F4EFE6]">{latestGarden.direction} Facing</span>
            </div>
          </div>

          {/* Center Botanical Preview Icons */}
          <div className="py-8 flex items-center justify-center">
            <div className="p-6 rounded-full bg-[#0E281E]/80 border border-[#D4AF37]/30 shadow-[0_0_25px_rgba(212,175,55,0.15)] flex items-center gap-4">
              <span className="text-3xl filter drop-shadow">🌿</span>
              <span className="text-3xl filter drop-shadow">🪴</span>
              <span className="text-3xl filter drop-shadow">🌱</span>
            </div>
          </div>

          {/* Bottom Metrics Bar & Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-[#D4AF37]/20">
            {/* Display: Room size, Direction, Number of plants, Last updated */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-[#A3C1AD] uppercase font-bold block">Sanctuary Size</span>
                <strong className="text-sm font-serif text-[#F4EFE6]">{areaSqFt} sq.ft</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#A3C1AD] uppercase font-bold block">Vastu Direction</span>
                <strong className="text-sm font-serif text-[#F4EFE6]">{latestGarden.direction}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#A3C1AD] uppercase font-bold block">Botanicals</span>
                <strong className="text-sm font-serif text-[#F4EFE6]">{latestGarden.plants?.length || 6} plants</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#A3C1AD] uppercase font-bold block">Last Curated</span>
                <strong className="text-sm font-serif text-[#F4EFE6]">
                  {new Date(latestGarden.updatedAt || Date.now()).toLocaleDateString()}
                </strong>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => onNavigate('planner', latestGarden._id)}
              className="py-3 px-6 rounded-full luxury-btn-gold text-[#081711] text-xs font-bold tracking-wide transition duration-200 shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 self-start sm:self-auto group"
            >
              <span>Continue Designing</span>
              <MoveRight className="w-4 h-4 text-[#081711] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* “Explore AYUSH” with elegant category pills */}
      <div className="space-y-4 pt-4 border-t border-[#D4AF37]/20">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif font-bold text-[#F4EFE6]">
            Explore AYUSH
          </h2>
          <span className="text-xs text-[#A3C1AD]">Traditional Pharmacopoeia</span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {ayushPills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => onNavigate('plants')}
              className="bg-[#0E281E]/70 hover:bg-[#D4AF37]/15 border border-[#D4AF37]/25 text-[#F4EFE6] hover:text-[#F6D985] hover:border-[#D4AF37]/60 px-5 py-2.5 rounded-full text-xs font-medium transition duration-200 shadow-sm"
            >
              🌿 {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Workspace Activity History */}
      {activities.length > 0 && (
        <div className="bg-[#0B1D16]/85 rounded-[2rem] p-6 border border-[#D4AF37]/30 shadow-md space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#D4AF37]/20 text-xs font-bold text-[#D4AF37] uppercase">
            <Clock className="w-3.5 h-3.5" />
            <span>Workspace Activity Log</span>
          </div>
          <div className="divide-y divide-[#D4AF37]/15 text-xs">
            {activities.slice(0, 4).map((act) => (
              <div key={act._id} className="py-2.5 flex items-center justify-between">
                <span className="text-[#F4EFE6] font-medium">{act.details}</span>
                <span className="text-[11px] text-[#A3C1AD] font-mono">
                  {new Date(act.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
