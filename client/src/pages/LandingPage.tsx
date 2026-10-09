import React from 'react';
import { Plant } from '../types';
import { PlantCard } from '../components/PlantCard';
import { Plant3DViewer } from '../components/Plant3DViewer';
import { 
  Sprout, 
  Compass, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Maximize2,
  CheckCircle2,
  ShieldCheck,
  MoveRight
} from 'lucide-react';

interface LandingPageProps {
  featuredPlants: Plant[];
  onNavigate: (tab: string, param?: string) => void;
  onViewPlantDetails: (plant: Plant) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  featuredPlants,
  onNavigate,
  onViewPlantDetails,
}) => {
  const ayushCategories = [
    {
      name: 'Ayurveda',
      tag: 'Rasayana & Tridosha Harmony',
      desc: 'Balancing mind and vital bio-energies through adaptogenic flora like Tulsi and Ashwagandha.',
    },
    {
      name: 'Siddha',
      tag: 'Kaya Kalpa Longevity',
      desc: 'Ancient Dravidian herbal alchemy focusing on cellular rejuvenation and revitalizing roots.',
    },
    {
      name: 'Unani',
      tag: 'Tibbi Four Humors',
      desc: 'Aromatic circulatory warming remedies harmonizing blood, phlegm, and vital spirits.',
    },
    {
      name: 'Yoga & Naturopathy',
      tag: 'Pranic Living Force',
      desc: 'Cooling succulent therapies and oxygen-rich greenery purifying domestic environments.',
    },
    {
      name: 'Homeopathy',
      tag: 'Potentized Botanicals',
      desc: 'Gentle flower extracts and alpine vulneraries supporting natural tissue recovery.',
    },
  ];

  return (
    <div className="space-y-28 pb-24 text-[#0F172A]">
      {/* 1. CINEMATIC HERO SECTION */}
      <section className="relative pt-12 lg:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Editorial Copy */}
          <div className="lg:col-span-7 space-y-6 lg:pr-6 text-center lg:text-left">
            {/* Small Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-[11px] font-bold tracking-[0.2em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              VIRTUAL HERBAL GARDEN
            </div>

            {/* Large Heading */}
            <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-serif font-normal text-[#0F172A] leading-[1.08] tracking-tight">
              Discover the wisdom of <br className="hidden sm:inline" />
              <span className="italic font-light text-[#2563EB]">AYUSH</span> through your space.
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-[#64748B] max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Explore medicinal plants, understand their traditional uses, and design a personalized herbal garden for your home using Vastu-inspired placement and real-world growing conditions.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start">
              <button
                type="button"
                onClick={() => onNavigate('plants')}
                className="py-3.5 px-7 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-sm font-semibold tracking-wide transition-all duration-200 shadow-md shadow-[#F97316]/20 flex items-center justify-center gap-2 group hover:scale-[1.02]"
              >
                <span>Explore Garden</span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('planner')}
                className="py-3.5 px-7 rounded-full bg-white hover:bg-[#F8FAFC] text-[#2563EB] text-sm font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 border border-[#2563EB]/30 hover:border-[#2563EB] shadow-xs"
              >
                <Compass className="w-4 h-4 text-[#2563EB]" />
                <span>Plan My Space</span>
              </button>
            </div>

            {/* Micro Highlights */}
            <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                22+ Classical Species
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                Interactive 3D WebGL
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                Vastu Directional Guidance
              </span>
            </div>
          </div>

          {/* Right Immersive Botanical Hero Visual with Floating Glass Cards */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-[2.5rem] p-3 bg-white shadow-[0_20px_50px_rgba(37,99,235,0.08)] border border-[#E2E8F0]">
              
              {/* 3D Botanical Canvas */}
              <div className="rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#F1F5F9] to-[#F8FAFC]">
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
              <div className="absolute -bottom-6 -left-4 sm:-left-8 bg-white rounded-2xl p-4 shadow-xl border border-[#E2E8F0] max-w-[240px] animate-float select-none">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <span className="text-[10px] font-bold tracking-[0.15em] text-[#2563EB] uppercase">
                    YOUR SPACE
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                </div>
                <div className="py-2.5 space-y-1 text-xs">
                  <div className="font-bold text-[#0F172A]">North-East</div>
                  <div className="text-[#64748B]">96 sq.ft</div>
                  <div className="text-[#22C55E] font-medium">6 plants recommended</div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('planner')}
                  className="w-full pt-2 text-xs font-bold text-[#2563EB] hover:text-[#1d4ed8] flex items-center justify-between transition group border-t border-[#E2E8F0]"
                >
                  <span>View Garden →</span>
                  <MoveRight className="w-3.5 h-3.5 text-[#2563EB] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Floating Aesthetic Tag on top right */}
              <div className="absolute -top-3 -right-3 bg-white rounded-full px-3.5 py-1 text-[10px] font-semibold text-[#0F172A] border border-[#E2E8F0] shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#F97316]" />
                Live 3D Specimen
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE FIVE AYUSH BOTANICAL PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-6">
          <div>
            <span className="text-[11px] font-bold tracking-[0.18em] text-[#2563EB] uppercase block">
              Classical Systems
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#0F172A] mt-1">
              The AYUSH Knowledge Framework
            </h2>
          </div>
          <p className="text-xs text-[#64748B] max-w-md">
            Holistic sciences recognized by the Ministry of AYUSH, pairing botanical pharmacology with natural circadian rhythms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {ayushCategories.map((cat) => (
            <div
              key={cat.name}
              onClick={() => onNavigate('plants')}
              className="bg-white hover-lift rounded-3xl p-6 flex flex-col justify-between cursor-pointer border border-[#E2E8F0] hover:border-[#2563EB]/40 shadow-xs hover:shadow-md transition duration-200 group"
            >
              <div>
                <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider block mb-2">
                  {cat.tag}
                </span>
                <h3 className="text-lg font-serif font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#64748B] mt-2.5 leading-relaxed font-normal">
                  {cat.desc}
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#2563EB]">
                <span>View flora</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#2563EB] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CURATED DIGITAL BOTANICAL GALLERY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-[0.18em] text-[#2563EB] uppercase block">
              Curated Specimens
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#0F172A] mt-1">
              Featured Medicinal Botanicals
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('plants')}
            className="text-xs font-bold text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-1.5 self-start sm:self-auto group transition"
          >
            <span>Explore all 22+ medicinal plants</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#2563EB] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredPlants.slice(0, 4).map((plant) => (
            <PlantCard
              key={plant._id}
              plant={plant}
              onViewDetails={onViewPlantDetails}
              onAddToGarden={() => onNavigate('planner')}
            />
          ))}
        </div>
      </section>

      {/* 4. ANCIENT VASTU MEETS MODERN SPATIAL DESIGN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] bg-[#0F172A] text-white p-8 sm:p-14 relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#2563EB]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-5">
              <span className="bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40 text-[10px] font-bold uppercase tracking-[0.2em] px-3.5 py-1 rounded-full inline-block">
                SPATIAL ORIENTATION
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-white leading-tight">
                Ancient herbal knowledge <br className="hidden sm:inline" />
                meets modern interior technology.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Traditional Vastu Shastra guides spatial solar geometry — aligning morning photon rays, cross ventilation, and directional tranquility. We pair cultural spatial principles with horticultural lighting conditions:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <strong className="text-[#F97316] font-serif block text-sm">North-East (Ishanya)</strong>
                  <p className="text-slate-300 mt-0.5 text-[11px]">
                    Receives gentle morning dawn. Auspicious for peaceful Rasayana herbs like Tulsi and Brahmi.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <strong className="text-[#F97316] font-serif block text-sm">South-East (Agni)</strong>
                  <p className="text-slate-300 mt-0.5 text-[11px]">
                    Associated with the fire element. Harmonizes warming culinary spices like Ginger and Cinnamon.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('planner')}
                  className="py-3 px-6 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white font-bold text-xs tracking-wide transition duration-200 shadow"
                >
                  Start Guided Vastu Plan →
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="bg-slate-900/80 rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-700/60 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs font-bold text-[#60A5FA] uppercase tracking-wider">Compass Matrix</span>
                  <span className="text-[10px] text-slate-400">8 Cardinal Zones</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Our planner allows you to scan your room or balcony with your browser camera, calibrate geographical orientation, and preview virtual 3D botanicals anchored to your floor.
                </p>
                <div className="p-3 rounded-xl bg-white/5 text-[11px] text-slate-400 italic">
                  * Vastu recommendations are presented as traditional cultural guidance for aesthetic harmony.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CINEMATIC WORKFLOW (01 to 04) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[11px] font-bold tracking-[0.18em] text-[#2563EB] uppercase">
            Four Guided Steps
          </span>
          <h2 className="text-3xl font-serif text-[#0F172A]">
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
            <div key={i} className="bg-white hover-lift rounded-3xl p-6 space-y-4 border border-[#E2E8F0] shadow-xs">
              <span className="text-3xl font-serif font-bold text-[#2563EB] block">
                {item.step}
              </span>
              <h3 className="text-base font-serif font-bold text-[#0F172A]">
                {item.title}
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
