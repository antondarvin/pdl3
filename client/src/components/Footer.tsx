import React from 'react';
import { Heart, Shield } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="mt-24 border-t border-slate-200 bg-slate-100/90 text-[#64748B] pt-16 pb-24 md:pb-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
              <span className="text-xl">🌿</span>
              <span className="font-serif font-bold text-lg text-[#0F172A] hover:text-[#2563EB] transition-colors">
                Virtual Herbal Garden
              </span>
            </div>
            <p className="text-xs text-[#64748B] max-w-sm leading-relaxed">
              Ancient herbal wisdom meets modern spatial AR technology. Curating AYUSH botanical education and traditional Vastu home greenery.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2 text-xs">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#2563EB] block">
              Navigation
            </span>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('plants')} className="hover:text-[#2563EB] transition-colors duration-200">
                  Explore Botanical Gallery
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('planner')} className="hover:text-[#2563EB] transition-colors duration-200">
                  Plan My Herbal Space
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('gardens')} className="hover:text-[#2563EB] transition-colors duration-200">
                  Saved Garden Designs
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('quiz')} className="hover:text-[#2563EB] transition-colors duration-200">
                  Learning & Quizzes
                </button>
              </li>
            </ul>
          </div>

          {/* AYUSH Framework */}
          <div className="space-y-2 text-xs">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#2563EB] block">
              AYUSH Systems
            </span>
            <ul className="space-y-1.5 text-[#64748B]">
              <li>Ayurveda</li>
              <li>Siddha</li>
              <li>Unani</li>
              <li>Yoga & Naturopathy</li>
              <li>Homeopathy</li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimers */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#64748B]">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} Virtual Herbal Garden. Educational & traditional botanical heritage. Not a substitute for clinical medical advice.
          </p>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span>Crafted for botanical preservation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
