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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fadeIn text-[#0F172A]">
      {/* Header: “Good morning, [Name] 🌿” / “Continue growing your herbal space.” */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#2563EB] uppercase block">
          PERSONAL HERBARIUM WORKSPACE
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#0F172A] tracking-tight">
          Good morning, {user?.name.split(' ')[0] || 'Botanist'} 🌿
        </h1>
        <p className="text-sm text-[#64748B]">
          Continue growing your herbal space.
        </p>
      </div>

      {/* Main Section: “Your Herbal Space” */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif font-bold text-[#0F172A]">
            Your Herbal Space
          </h2>
          <button
            onClick={() => onNavigate('gardens')}
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition flex items-center gap-1"
          >
            All saved spaces ({gardens.length}) →
          </button>
        </div>

        {/* Large Botanical Visualization Canvas */}
        <div className="relative rounded-[2.5rem] overflow-hidden bg-white border border-[#E2E8F0] p-8 sm:p-12 shadow-sm min-h-[380px] flex flex-col justify-between">
          {/* Background Subtle Room Canvas Graphic */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#F8FAFC] via-white to-[#F1F5F9] opacity-90" />
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-[#2563EB]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Status Tags */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#2563EB] uppercase block">
                ACTIVE LAYOUT
              </span>
              <h3 className="text-2xl font-serif font-bold text-[#0F172A] mt-0.5">
                {latestGarden.gardenName}
              </h3>
            </div>

            <div className="bg-white/90 rounded-full px-4 py-1.5 border border-[#E2E8F0] shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-xs font-bold text-[#0F172A]">{latestGarden.direction} Facing</span>
            </div>
          </div>

          {/* Center Botanical Preview Icons */}
          <div className="py-8 flex items-center justify-center">
            <div className="p-6 rounded-full bg-white/80 border border-[#E2E8F0] shadow-xs flex items-center gap-3">
              <span className="text-3xl">🌿</span>
              <span className="text-3xl">🪴</span>
              <span className="text-3xl">🌱</span>
            </div>
          </div>

          {/* Bottom Metrics Bar & Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-[#E2E8F0]">
            {/* Display: Room size, Direction, Number of plants, Last updated */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-[#64748B] uppercase font-bold block">Room Size</span>
                <strong className="text-sm font-serif text-[#0F172A]">{areaSqFt} sq.ft</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] uppercase font-bold block">Direction</span>
                <strong className="text-sm font-serif text-[#0F172A]">{latestGarden.direction}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] uppercase font-bold block">Number of Plants</span>
                <strong className="text-sm font-serif text-[#0F172A]">{latestGarden.plants?.length || 6} plants</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] uppercase font-bold block">Last Updated</span>
                <strong className="text-sm font-serif text-[#0F172A]">
                  {new Date(latestGarden.updatedAt || Date.now()).toLocaleDateString()}
                </strong>
              </div>
            </div>

            {/* Primary Action Button: “Continue Designing →” */}
            <button
              type="button"
              onClick={() => onNavigate('planner', latestGarden._id)}
              className="py-3 px-6 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs font-bold tracking-wide transition duration-200 shadow-md shadow-[#F97316]/20 flex items-center justify-center gap-2 self-start sm:self-auto group"
            >
              <span>Continue Designing</span>
              <MoveRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* “Explore AYUSH” with elegant category pills */}
      <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif font-bold text-[#0F172A]">
            Explore AYUSH
          </h2>
          <span className="text-xs text-[#64748B]">Traditional Pharmacopoeia</span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {ayushPills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => onNavigate('plants')}
              className="bg-white hover-lift px-5 py-2.5 rounded-full text-xs font-semibold text-[#0F172A] hover:text-[#2563EB] hover:border-[#2563EB]/30 border border-[#E2E8F0] transition duration-200 shadow-2xs"
            >
              🌿 {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Workspace Activity History */}
      {activities.length > 0 && (
        <div className="bg-white rounded-[2rem] p-6 border border-[#E2E8F0] shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase">
            <Clock className="w-3.5 h-3.5" />
            <span>Workspace Activity Log</span>
          </div>
          <div className="divide-y divide-[#E2E8F0] text-xs">
            {activities.slice(0, 4).map((act) => (
              <div key={act._id} className="py-2.5 flex items-center justify-between">
                <span className="text-[#0F172A] font-medium">{act.details}</span>
                <span className="text-[11px] text-[#64748B] font-mono">
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
