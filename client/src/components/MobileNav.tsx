import React from 'react';
import { Home, Sprout, Compass, FolderHeart, User, Camera, Download } from 'lucide-react';

interface MobileNavProps {
  currentTab: string;
  onNavigate: (tab: string, param?: string) => void;
  onOpenInstallModal?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onNavigate, onOpenInstallModal }) => {
  const items = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'plants', label: 'Plants', icon: Sprout },
    { id: 'planner', label: '3D Garden', icon: Compass },
    { id: 'camera', label: 'Camera/AR', icon: Camera },
    { id: 'gardens', label: 'My Garden', icon: FolderHeart },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] inset-x-3 z-40">
      <div className="glass-nav rounded-2xl px-2 py-1.5 shadow-[0_12px_36px_rgba(15,23,42,0.15)] border border-slate-200/90 bg-white/95 backdrop-blur-xl flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (item.id === 'plants' && currentTab === 'plant-detail') ||
            (item.id === 'camera' && currentTab === 'planner');

          const isCamera = item.id === 'camera';

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'camera') {
                  onNavigate('planner', 'ar');
                } else {
                  onNavigate(item.id);
                }
              }}
              className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-[#2563EB] font-bold'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition ${
                  isCamera
                    ? 'bg-[#22C55E]/15 text-[#16A34A] ring-1 ring-[#22C55E]/30 shadow-2xs'
                    : isActive
                    ? 'bg-[#2563EB]/10 text-[#2563EB]'
                    : ''
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[9px] tracking-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
