import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, User, LogOut, Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, param?: string) => void;
  onOpenSearch?: () => void;
  onOpenInstallModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onOpenSearch, onOpenInstallModal }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const primaryNavItems = [
    { id: 'plants', label: 'Explore Herbarium' },
    { id: 'planner', label: '3D Space Plan' },
    { id: 'gardens', label: 'My Sanctuary' },
    { id: 'quiz', label: 'AYUSH Lore' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-4 z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-[#0B1E17]/90 backdrop-blur-2xl rounded-full px-5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex items-center justify-between border border-[#D4AF37]/30 transition-all duration-300">
        
        {/* Royal Botanical Logo */}
        <div
          onClick={() => handleNavClick('landing')}
          className="flex items-center gap-2.5 cursor-pointer group select-none pl-1"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8C6D15] p-0.5 shadow-md group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full bg-[#081711] flex items-center justify-center text-sm">
              🌿
            </div>
          </div>
          <span className="font-serif text-lg font-bold tracking-tight luxury-gold-text">
            Virtual Herbal Garden
          </span>
        </div>

        {/* Center Primary Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#071610]/85 p-1 rounded-full border border-[#D4AF37]/20 shadow-inner">
          {primaryNavItems.map((item) => {
            const isActive =
              currentTab === item.id ||
              (item.id === 'plants' && currentTab === 'plant-detail');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#F6D985] via-[#E5C158] to-[#D4AF37] text-[#081711] font-bold shadow-md'
                    : 'text-[#A3C1AD] hover:text-[#F6D985] hover:bg-[#D4AF37]/10'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Search + Install + Profile / Sign In */}
        <div className="hidden md:flex items-center gap-2.5 pr-1">
          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => {
              if (onOpenSearch) onOpenSearch();
              else handleNavClick('plants');
            }}
            className="p-2 rounded-full text-[#A3C1AD] hover:text-[#F6D985] hover:bg-[#D4AF37]/10 transition-colors"
            title="Search medicinal botanicals"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Install App Trigger */}
          {onOpenInstallModal && (
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#F6D985] bg-[#0E281E] hover:bg-[#133629] border border-[#D4AF37]/35 transition flex items-center gap-1.5 shadow-sm"
              title="Install cross-platform PWA application"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Install App</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNavClick('dashboard')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  currentTab === 'dashboard'
                    ? 'bg-[#D4AF37] text-[#081711] font-bold border-[#D4AF37]'
                    : 'bg-[#0E281E] border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#F4EFE6]'
                }`}
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-5 h-5 rounded-full object-cover border border-[#D4AF37]/40"
                />
                <span className="truncate max-w-[100px]">{user.name.split(' ')[0]}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('profile')}
                className="p-2 rounded-full text-[#A3C1AD] hover:text-[#F6D985] hover:bg-[#D4AF37]/10 transition"
                title="Profile Settings"
              >
                <User className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-full text-[#A3C1AD] hover:text-[#EF4444] hover:bg-red-950/40 transition"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNavClick('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#A3C1AD] hover:text-[#F6D985] transition"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('signup')}
                className="px-4 py-1.5 text-xs font-bold luxury-btn-gold text-[#081711] rounded-full transition duration-200 shadow-md flex items-center gap-1"
              >
                Join Sanctuary <ArrowUpRight className="w-3 h-3 text-[#081711]" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-full text-[#F4EFE6] hover:bg-[#D4AF37]/10"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Glass Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 bg-[#0B1E17]/95 backdrop-blur-2xl rounded-3xl p-5 space-y-3 shadow-2xl border border-[#D4AF37]/30 animate-fadeIn text-[#F4EFE6]">
          <div className="grid grid-cols-2 gap-2">
            {primaryNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`p-3 rounded-2xl text-xs font-bold text-left transition ${
                  currentTab === item.id
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8891D] text-[#081711]'
                    : 'bg-[#0E281E] text-[#F4EFE6] hover:bg-[#133629] border border-[#D4AF37]/20'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {onOpenInstallModal && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenInstallModal();
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#0E281E] border border-[#D4AF37]/35 text-[#F6D985] text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Install Herbal Sanctuary App</span>
            </button>
          )}

          <div className="pt-2 border-t border-[#D4AF37]/20 flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={() => handleNavClick('profile')}
                  className="flex items-center gap-2 text-xs font-bold text-[#F4EFE6] hover:text-[#F6D985]"
                >
                  <User className="w-4 h-4 text-[#D4AF37]" />
                  {user.name}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs text-[#EF4444] font-semibold hover:underline"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => handleNavClick('login')}
                  className="flex-1 py-2 text-xs font-bold border border-[#D4AF37]/30 text-[#F4EFE6] hover:border-[#D4AF37] rounded-full text-center transition"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('signup')}
                  className="flex-1 py-2 text-xs font-bold luxury-btn-gold text-[#081711] rounded-full text-center transition duration-200 shadow-sm"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
