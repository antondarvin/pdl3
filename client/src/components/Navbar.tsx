import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, User, LogOut, Menu, X, ArrowUpRight } from 'lucide-react';

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
    { id: 'plants', label: 'Explore' },
    { id: 'planner', label: 'Plan' },
    { id: 'gardens', label: 'My Garden' },
    { id: 'quiz', label: 'Learn' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-4 z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="glass-nav rounded-full px-5 py-3 shadow-[0_8px_32px_rgba(15,23,42,0.05)] flex items-center justify-between border border-slate-200 transition-all duration-300">
        
        {/* Minimal Botanical Logo */}
        <div
          onClick={() => handleNavClick('landing')}
          className="flex items-center gap-2.5 cursor-pointer group select-none pl-1"
        >
          <span className="text-xl group-hover:scale-110 transition-transform duration-300">🌿</span>
          <span className="font-serif text-lg font-bold tracking-tight text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
            Virtual Herbal Garden
          </span>
        </div>

        {/* Center Primary Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200">
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
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-[#2563EB] hover:bg-white'
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
            className="p-2 rounded-full text-[#64748B] hover:text-[#2563EB] hover:bg-slate-100 transition-colors"
            title="Search medicinal plants"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Install App Trigger */}
          {onOpenInstallModal && (
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-[#0F172A] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition flex items-center gap-1.5 shadow-2xs"
              title="Install cross-platform PWA application"
            >
              <span>📲</span>
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
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-[#0F172A]'
                }`}
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="truncate max-w-[100px]">{user.name.split(' ')[0]}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('profile')}
                className="p-2 rounded-full text-[#64748B] hover:text-[#2563EB] hover:bg-slate-100 transition"
                title="Profile Settings"
              >
                <User className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-full text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 transition"
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
                className="px-3.5 py-1.5 text-xs font-semibold text-[#64748B] hover:text-[#2563EB] transition"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('signup')}
                className="px-4 py-1.5 text-xs font-semibold bg-[#F97316] hover:bg-[#EA580C] text-white rounded-full transition duration-200 shadow-sm flex items-center gap-1"
              >
                Join <ArrowUpRight className="w-3 h-3 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-full text-[#0F172A] hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Glass Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 glass-nav rounded-3xl p-5 space-y-3 shadow-xl border border-slate-200 animate-fadeIn bg-white/95">
          <div className="grid grid-cols-2 gap-2">
            {primaryNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`p-3 rounded-2xl text-xs font-bold text-left transition ${
                  currentTab === item.id
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-slate-50 text-[#0F172A] hover:bg-white border border-slate-200'
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
              className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <span>📲</span>
              <span>Install Herbal Garden App</span>
            </button>
          )}

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={() => handleNavClick('profile')}
                  className="flex items-center gap-2 text-xs font-bold text-[#0F172A] hover:text-[#2563EB]"
                >
                  <User className="w-4 h-4 text-[#2563EB]" />
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
                  className="flex-1 py-2 text-xs font-bold border border-slate-200 text-[#0F172A] hover:border-blue-300 hover:text-[#2563EB] rounded-full text-center transition"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('signup')}
                  className="flex-1 py-2 text-xs font-bold bg-[#F97316] hover:bg-[#EA580C] text-white rounded-full text-center transition duration-200 shadow-sm"
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
