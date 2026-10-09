import React from 'react';
import { Plant, RecommendationMatch } from '../types';
import { Check, Compass, Sun, Droplets, Info, Eye, Camera, Sparkles } from 'lucide-react';

interface VastuRecommendationEngineProps {
  plants: Plant[];
  direction: string;
  roomType: string;
  sunlight: 'Low' | 'Medium' | 'High';
  waterAvailability: 'Low' | 'Moderate' | 'High';
  maintenancePreference: 'Low' | 'Medium' | 'High';
  spaceSqFt: number;
  onSelectPlantForGarden: (plant: Plant) => void;
  onViewPlantDetails: (plant: Plant) => void;
  onAutoArrangePlants?: (plants: Plant[]) => void;
}

export const VastuRecommendationEngine: React.FC<VastuRecommendationEngineProps> = ({
  plants,
  direction,
  roomType,
  sunlight,
  waterAvailability,
  maintenancePreference,
  spaceSqFt,
  onSelectPlantForGarden,
  onViewPlantDetails,
  onAutoArrangePlants,
}) => {
  // Recommendation Scoring Logic
  const scoredRecommendations: RecommendationMatch[] = plants.map((plant) => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Traditional Vastu direction alignment
    const vastuMatch = plant.vastuDirections.some(
      (d) => d.toLowerCase() === direction.toLowerCase()
    );
    if (vastuMatch) {
      score += 42;
      reasons.push(`Compatible with selected traditional ${direction} direction`);
    } else {
      reasons.push(`Can be harmonized with supplemental natural illumination`);
    }

    // 2. Sunlight condition compatibility
    const pSun = plant.sunlight.toLowerCase();
    const curSun = sunlight.toLowerCase();
    let sunlightMatch = false;

    if (curSun === 'high' && (pSun.includes('high') || pSun.includes('full'))) {
      sunlightMatch = true;
      score += 30;
      reasons.push(`Suitable sunlight (Matches ${sunlight} illumination)`);
    } else if (curSun === 'medium' && (pSun.includes('medium') || pSun.includes('partial') || pSun.includes('filtered'))) {
      sunlightMatch = true;
      score += 30;
      reasons.push(`Suitable sunlight (Matches ${sunlight} illumination)`);
    } else if (curSun === 'low' && (pSun.includes('low') || pSun.includes('shade') || pSun.includes('indoor'))) {
      sunlightMatch = true;
      score += 30;
      reasons.push(`Suitable sunlight (Tolerates shade)`);
    } else {
      score += 15;
      reasons.push(`Acceptable with windowsill placement`);
    }

    // 3. Space compatibility
    const isSmall = plant.spaceRequired.toLowerCase().includes('small');
    let spaceMatch = true;
    if (spaceSqFt < 35 && !isSmall) {
      spaceMatch = false;
      score += 8;
      reasons.push(`Requires container pruning in cozy space (${spaceSqFt} sq.ft)`);
    } else {
      score += 18;
      reasons.push(`Suitable space (${plant.spaceRequired} matches layout)`);
    }

    // 4. Maintenance level
    score += 10;

    return {
      plant,
      score: Math.min(98, score),
      reasons,
      vastuMatch,
      sunlightMatch,
      spaceMatch,
      maintenanceMatch: true,
    };
  });

  scoredRecommendations.sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-8">
      {/* Heading: “Plants chosen for your space” */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E2E8F0] pb-6">
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#2563EB] uppercase block">
            CURATED BOTANICAL MATCHES
          </span>
          <h2 className="text-3xl font-serif font-bold text-[#0F172A] mt-0.5">
            Plants chosen for your space
          </h2>
        </div>
        <div className="bg-white px-4 py-1.5 rounded-full border border-[#E2E8F0] shadow-xs text-xs text-[#64748B] self-start sm:self-auto">
          Orientation: <strong className="text-[#0F172A]">{direction}</strong> • {spaceSqFt} sq.ft
        </div>
      </div>

      {/* Smart Auto-Arrangement Action Bar */}
      {onAutoArrangePlants && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-[#2563EB] text-white shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <strong className="text-sm font-serif font-bold text-[#0F172A] block">
                Automatic Vastu Botanical Arrangement
              </strong>
              <p className="text-xs text-[#64748B] mt-0.5">
                Automatically stage the top {Math.min(4, scoredRecommendations.length)} recommended medicinal plants into auspicious {direction} quadrants with verified clearance spacing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAutoArrangePlants(scoredRecommendations.slice(0, 4).map((r) => r.plant))}
            className="py-3 px-6 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-bold text-xs tracking-wider transition shadow-md shadow-blue-500/20 shrink-0 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Auto-Arrange Top Matches</span>
          </button>
        </div>
      )}

      {/* Grid of Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scoredRecommendations.slice(0, 6).map((item) => {
          const { plant, score, reasons } = item;

          return (
            <div
              key={plant._id}
              className="bg-white hover-lift rounded-[2rem] p-6 border border-[#E2E8F0] shadow-xs hover:border-[#2563EB]/30 transition duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                {/* Header: Plant Photo + Score badge */}
                <div className="flex items-start gap-4">
                  <img
                    src={plant.image}
                    alt={plant.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-[#E2E8F0] shadow-xs shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        {plant.ayushSystem}
                      </span>
                      <span className="text-xs font-bold text-[#2563EB] bg-[#2563EB]/10 px-2.5 py-0.5 rounded-full border border-[#2563EB]/20">
                        {score}% Match
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#0F172A] truncate mt-1 uppercase">
                      {plant.name.split(' ')[0]}
                    </h3>
                    <p className="text-[11px] font-mono italic text-[#64748B] truncate">
                      {plant.scientificName}
                    </p>
                  </div>
                </div>

                {/* Checklist (e.g. ✓ Suitable sunlight, ✓ Suitable space, ✓ Compatible with selected traditional direction) */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                  {reasons.slice(0, 3).map((r, rIdx) => (
                    <div key={rIdx} className="flex items-start gap-2 text-[#0F172A]">
                      <Check className="w-3.5 h-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-tight">{r}</span>
                    </div>
                  ))}
                </div>

                {/* Spec Indicators: Sunlight, Water, Vastu */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#64748B]">
                  <div className="p-2 rounded-xl bg-white border border-[#E2E8F0]">
                    <span className="text-[9px] text-[#64748B] uppercase block font-bold">Vastu Direction</span>
                    <strong className="text-[#0F172A]">{plant.vastuDirections[0]}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#E2E8F0]">
                    <span className="text-[9px] text-[#64748B] uppercase block font-bold">Care Difficulty</span>
                    <strong className="text-[#0F172A]">{plant.maintenanceLevel}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons: “View Plant” & “Visualize” */}
              <div className="pt-2 flex items-center gap-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => onViewPlantDetails(plant)}
                  className="flex-1 py-2.5 px-3 rounded-full border border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB] text-xs font-semibold text-[#0F172A] transition duration-200 text-center"
                >
                  View Plant
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPlantForGarden(plant)}
                  className="flex-1 py-2.5 px-3 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs font-semibold transition duration-200 text-center shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                  <span>Visualize</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ethical note */}
      <div className="text-[11px] text-[#64748B] italic text-center pt-2">
        * Vastu compatibility reflects traditional Indian cultural spatial planning and is not an empirical scientific claim.
      </div>
    </div>
  );
};
