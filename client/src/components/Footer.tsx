import React from 'react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="mt-24 border-t border-[#D4AF37]/25 bg-[#06120D]/95 text-[#A3C1AD] pt-16 pb-24 md:pb-14 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(212,175,55,0.06),transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('landing')}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8C6D15] p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-[#081711] flex items-center justify-center text-sm">
                  🌿
                </div>
              </div>
              <span className="font-serif font-bold text-lg luxury-gold-text">
                Virtual Herbal Sanctuary
              </span>
            </div>
            <p className="text-xs text-[#A3C1AD] max-w-sm leading-relaxed">
              Classical Ayurvedic herbal wisdom meets modern spatial Augmented Reality. Curating AYUSH medicinal plant education and royal Vastu sanctuary planning.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2 text-xs">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F6D985] block">
              Navigation
            </span>
            <ul className="space-y-2 text-[#E8E2D5]">
              <li>
                <button onClick={() => onNavigate('plants')} className="hover:text-[#F6D985] transition-colors duration-200">
                  Explore Herbarium
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('planner')} className="hover:text-[#F6D985] transition-colors duration-200">
                  Plan 3D Sanctuary
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('gardens')} className="hover:text-[#F6D985] transition-colors duration-200">
                  Saved Garden Designs
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('quiz')} className="hover:text-[#F6D985] transition-colors duration-200">
                  AYUSH Lore & Quizzes
                </button>
              </li>
            </ul>
          </div>

          {/* AYUSH Framework */}
          <div className="space-y-2 text-xs">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F6D985] block">
              AYUSH Pillars
            </span>
            <ul className="space-y-1.5 text-[#A3C1AD]">
              <li>Ayurveda • Rasayana</li>
              <li>Siddha • Kaya Kalpa</li>
              <li>Unani • Tibbi Balance</li>
              <li>Yoga & Naturopathy</li>
              <li>Homeopathy</li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimers */}
        <div className="pt-6 border-t border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#7E9C88]">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} Virtual Herbal Sanctuary. Educational & royal Ayurvedic heritage. Not a substitute for clinical medical diagnosis.
          </p>
          <div className="flex items-center gap-1.5 text-[#F6D985]/70">
            <span>✨ Crafted for botanical heritage & spatial harmony</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
