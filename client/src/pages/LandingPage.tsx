import React from 'react';
import { Plant } from '../types';
import { PlantCard } from '../components/PlantCard';
import { Plant3DViewer } from '../components/Plant3DViewer';
import { 
  Sprout, 
  Compass, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  MoveRight,
  Camera
} from 'lucide-react';

interface LandingPageProps {
  featuredPlants: Plant[];
  onNavigate: (tab: string, param?: string) => void;
  onViewPlantDetails: (plant: Plant) => void;
  onViewInYourSpace?: (plant: Plant) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  featuredPlants,
  onNavigate,
  onViewPlantDetails,
  onViewInYourSpace,
}) => {
  const ayushCategories = [
    {
      name: 'Ayurveda',
      tag: 'Rasayana & Tridosha Harmony',
      desc: 'Balancing mind and vital bio-energies through classical adaptogenic flora like Sacred Tulsi and Ashwagandha.',
    },
    {
      name: 'Siddha',
      tag: 'Kaya Kalpa Longevity',
      desc: 'Ancient Dravidian herbal alchemy focusing on cellular rejuvenation, herbal minerals, and revitalizing roots.',
    },
    {
      name: 'Unani',
      tag: 'Tibbi Four Humors',
      desc: 'Aromatic circulatory warming remedies harmonizing blood, phlegm, and vital constitutional spirits.',
    },
    {
      name: 'Yoga & Naturopathy',
      tag: 'Pranic Living Force',
      desc: 'Cooling succulent therapies and oxygen-rich greenery purifying domestic indoor and balcony environments.',
    },
    {
      name: 'Homeopathy',
      tag: 'Potentized Botanicals',
      desc: 'Gentle golden flower extracts and alpine vulneraries supporting natural systemic cellular vitality.',
    },
  ];

  return (
    <div className="space-y-28 pb-24 text-[#F4EFE6]">
      {/* 1. CINEMATIC ROYAL HERO SECTION */}
      <section className="relative pt-12 lg:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Editorial Copy */}
          <div className="lg:col-span-7 space-y-6 lg:pr-6 text-center lg:text-left">
            {/* Small Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0E281E] text-[#F6D985] border border-[#D4AF37]/35 text-[11px] font-bold tracking-[0.2em] uppercase shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              ROYAL HERBAL SANCTUARY & AR
            </div>

            {/* Large Regal Heading */}
            <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-serif font-normal text-[#F4EFE6] leading-[1.08] tracking-tight">
              Discover the wisdom of <br className="hidden sm:inline" />
              <span className="italic font-light luxury-gold-text">AYUSH</span> through your space.
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-[#A3C1AD] max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Explore revered medicinal flora, master classical Ayurvedic lore, and design an auspicious royal herbal conservatory for your home using Vastu-inspired spatial harmony and genuine camera AR.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start">
              <button
                type="button"
                onClick={() => onNavigate('plants')}
                className="py-3.5 px-7 rounded-full luxury-btn-gold text-[#081711] text-sm font-bold tracking-wide transition-all duration-200 shadow-lg flex items-center justify-center gap-2 group hover:scale-[1.02]"
              >
                <span>Explore Herbarium</span>
                <ArrowRight className="w-4 h-4 text-[#081711] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('planner')}
                className="py-3.5 px-7 rounded-full bg-[#0E281E] hover:bg-[#153D2E] text-[#F6D985] text-sm font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 border border-[#D4AF37]/40 shadow-sm"
              >
                <Compass className="w-4 h-4 text-[#F6D985]" />
                <span>3D Space Sanctuary</span>
              </button>
            </div>

            {/* Micro Highlights */}
            <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#A3C1AD]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                22+ Classical Species
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                Interactive 3D WebGL
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                Vastu Spatial Energy Matrix
              </span>
            </div>
          </div>

          {/* Right Immersive Botanical Hero Visual with Floating Glass Cards */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-[2.5rem] p-3 bg-[#0E281E]/80 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-[#D4AF37]/30">
              
              {/* 3D Botanical Canvas */}
              <div className="rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#081711] via-[#0C241B] to-[#06120D] border border-[#D4AF37]/15">
                <Plant3DViewer
                  modelConfig={{
                    type: 'tulsi',
                    potColor: '#b25e36',
                    foliageColor: '#2b5e3f',
                    flowerColor: '#9f67d4',
                    heightScale: 1.1,
                  }}
                  plantName="Sacred Tulsi (Ocimum tenuiflorum)"
                  height="440px"
                  autoRotate={true}
                />
              </div>

              {/* FLOATING INFORMATION CARD: Animated subtly per design specification */}
              <div className="absolute -bottom-6 -left-4 sm:-left-8 bg-[#0B1E17]/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-[#D4AF37]/35 max-w-[240px] animate-float select-none text-[#F4EFE6]">
                <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/20">
                  <span className="text-[10px] font-bold tracking-[0.15em] text-[#F6D985] uppercase">
                    AUSPICIOUS SPACE
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                </div>
                <div className="py-2.5 space-y-1 text-xs">
                  <div className="font-bold text-[#F4EFE6]">North-East (Ishanya)</div>
                  <div className="text-[#A3C1AD]">96 sq.ft balcony</div>
                  <div className="text-[#10B981] font-medium">6 medicinal plants compatible</div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('planner')}
                  className="w-full pt-2 text-xs font-bold text-[#F6D985] hover:text-white flex items-center justify-between transition group border-t border-[#D4AF37]/20"
                >
                  <span>View Sanctuary →</span>
                  <MoveRight className="w-3.5 h-3.5 text-[#F6D985] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Floating Aesthetic Tag on top right */}
              <div className="absolute -top-3 -right-3 bg-[#0B1E17]/95 backdrop-blur-md rounded-full px-3.5 py-1 text-[10px] font-semibold text-[#F6D985] border border-[#D4AF37]/35 shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                Live 3D Specimen
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE FIVE AYUSH BOTANICAL PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D4AF37]/25 pb-6">
          <div>
            <span className="text-[11px] font-bold tracking-[0.18em] text-[#F6D985] uppercase block">
              Classical Traditions
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#F4EFE6] mt-1">
              The Five AYUSH Pillars
            </h2>
          </div>
          <p className="text-xs text-[#A3C1AD] max-w-sm">
            Rooted in thousands of years of classical clinical wisdom and traditional Indian medicinal philosophy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {ayushCategories.map((cat) => (
            <div
              key={cat.name}
              onClick={() => onNavigate('plants')}
              className="bg-[#0E281E]/80 backdrop-blur-xl hover-lift rounded-3xl p-6 flex flex-col justify-between cursor-pointer border border-[#D4AF37]/25 hover:border-[#D4AF37]/60 shadow-xl transition duration-300 group"
            >
              <div>
                <span className="text-[10px] font-bold text-[#F6D985] uppercase tracking-wider block mb-2">
                  {cat.tag}
                </span>
                <h3 className="text-lg font-serif font-bold text-[#F4EFE6] group-hover:text-[#F6D985] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#A3C1AD] mt-2.5 leading-relaxed font-normal">
                  {cat.desc}
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-[#D4AF37]/20 flex items-center justify-between text-xs font-semibold text-[#F6D985]">
                <span>View flora</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CURATED DIGITAL BOTANICAL GALLERY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-[0.18em] text-[#F6D985] uppercase block">
              Curated Herbarium
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#F4EFE6] mt-1">
              Featured Medicinal Botanicals
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('plants')}
            className="text-xs font-bold text-[#F6D985] hover:text-[#FFF0B8] flex items-center gap-1.5 self-start sm:self-auto group transition"
          >
            <span>Explore all 22+ medicinal plants</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredPlants.slice(0, 4).map((plant) => (
            <PlantCard
              key={plant._id}
              plant={plant}
              onViewDetails={onViewPlantDetails}
              onAddToGarden={() => onNavigate('planner')}
              onViewInYourSpace={onViewInYourSpace}
            />
          ))}
        </div>
      </section>

      {/* 4. ANCIENT VASTU MEETS MODERN SPATIAL DESIGN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] bg-[#071711]/95 text-[#F4EFE6] p-8 sm:p-14 relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-[#D4AF37]/35">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-5">
              <span className="bg-[#D4AF37]/15 text-[#F6D985] border border-[#D4AF37]/40 text-[10px] font-bold uppercase tracking-[0.2em] px-3.5 py-1 rounded-full inline-block">
                VASTU SPATIAL HARMONY
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#F4EFE6] leading-tight">
                Ancient herbal energy <br className="hidden sm:inline" />
                meets modern interior spatial design.
              </h2>
              <p className="text-xs sm:text-sm text-[#A3C1AD] leading-relaxed max-w-xl">
                Traditional Vastu Shastra guides spatial solar geometry — aligning morning photon rays, cross ventilation, and directional serenity. We pair classical Vedic orientations with real-world growing conditions:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-4 rounded-2xl bg-[#0E281E]/80 border border-[#D4AF37]/25 shadow-inner">
                  <strong className="text-[#F6D985] font-serif block text-sm">North-East (Ishanya)</strong>
                  <p className="text-[#A3C1AD] mt-1 text-[11px] leading-relaxed">
                    Receives tranquil morning dawn. Auspicious for peaceful Rasayana herbs like Sacred Tulsi and Brahmi.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#0E281E]/80 border border-[#D4AF37]/25 shadow-inner">
                  <strong className="text-[#FFA56B] font-serif block text-sm">South-East (Agni)</strong>
                  <p className="text-[#A3C1AD] mt-1 text-[11px] leading-relaxed">
                    Associated with the fire element. Harmonizes warming culinary spices like Ginger and Cinnamon.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('planner')}
                  className="py-3 px-7 rounded-full luxury-btn-gold text-[#081711] font-bold text-xs tracking-wide transition duration-200 shadow-md"
                >
                  Start Guided Vastu Plan →
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="bg-[#0B1E17]/90 rounded-3xl p-6 max-w-sm w-full space-y-4 border border-[#D4AF37]/30 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
                  <span className="text-xs font-bold text-[#F6D985] uppercase tracking-wider">Compass Energy Matrix</span>
                  <span className="text-[10px] text-[#A3C1AD]">8 Cardinal Zones</span>
                </div>
                <p className="text-xs text-[#C9DDD0] leading-relaxed">
                  Our planner allows you to scan your room or balcony with your camera, calibrate geographical orientation, and preview virtual 3D botanicals anchored to your floor in genuine AR.
                </p>
                <div className="p-3 rounded-xl bg-[#071610] border border-[#D4AF37]/15 text-[11px] text-[#A3C1AD] italic">
                  * Vastu recommendations are presented as traditional cultural spatial heritage for aesthetic harmony.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CINEMATIC WORKFLOW (01 to 04) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[11px] font-bold tracking-[0.18em] text-[#F6D985] uppercase">
            Four Guided Steps
          </span>
          <h2 className="text-3xl font-serif text-[#F4EFE6]">
            Designing Your Botanical Space
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Room Scan & Dimensions',
              desc: 'Use camera surface scanning or enter manual dimensions (length × width) to calculate available square footage.',
            },
            {
              step: '02',
              title: 'Direction Calibration',
              desc: 'Detect your room orientation with mobile orientation sensors or manual interactive compass rose alignment.',
            },
            {
              step: '03',
              title: 'Vastu Compatibility',
              desc: 'Our engine ranks botanicals based on natural sunlight, spatial volume, and traditional cardinal placement.',
            },
            {
              step: '04',
              title: '3D & AR Placement',
              desc: 'Arrange plants on an interactive top-down floor map or project virtual specimens directly into your room via AR.',
            },
          ].map((item, i) => (
            <div key={i} className="bg-[#0E281E]/80 backdrop-blur-xl hover-lift rounded-3xl p-6 space-y-4 border border-[#D4AF37]/25 shadow-xl">
              <span className="text-3xl font-serif font-bold luxury-gold-text block">
                {item.step}
              </span>
              <h3 className="text-base font-serif font-bold text-[#F4EFE6]">
                {item.title}
              </h3>
              <p className="text-xs text-[#A3C1AD] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
