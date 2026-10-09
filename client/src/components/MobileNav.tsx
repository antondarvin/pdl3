import React from 'react';
import { Home, Sprout, Compass, FolderHeart, User, Camera } from 'lucide-react';

interface MobileNavProps {
  currentTab: string;
  onNavigate: (tab: string, param?: string) => void;
  onOpenInstallModal?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onNavigate }) => {
  const items = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'plants', label: 'Plants', icon: Sprout },
    { id: 'planner', label: '3D Space', icon: Compass },
    { id: 'camera', label: 'Camera AR', icon: Camera },
    { id: 'gardens', label: 'My Garden', icon: FolderHeart },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] inset-x-3 z-40">
      <div className="rounded-2xl px-2 py-1.5 shadow-[0_16px_45px_rgba(0,0,0,0.8)] border border-[#D4AF37]/30 bg-[#0B1E17]/95 backdrop-blur-2xl flex items-center justify-around">
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
                  ? 'text-[#F6D985] font-bold'
                  : 'text-[#A3C1AD] hover:text-[#F4EFE6]'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition ${
                  isCamera
                    ? 'bg-[#E08A3C]/20 text-[#FFA56B] ring-1 ring-[#E08A3C]/40 shadow-sm'
                    : isActive
                    ? 'bg-[#D4AF37]/15 text-[#F6D985] ring-1 ring-[#D4AF37]/35 shadow-sm'
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
