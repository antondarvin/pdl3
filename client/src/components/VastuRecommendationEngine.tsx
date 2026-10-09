import React, { useMemo } from 'react';
import { Plant, RecommendationMatch } from '../types';
import { Check, Compass, Sun, Droplets, Info, Eye, Camera, Sparkles } from 'lucide-react';
import { 
  filterPlantsByVastuDirection, 
  getVastuDirectionMetadata, 
  VASTU_DIRECTIONS,
  normalizeVastuDirection 
} from '../utils/vastuRules';

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
  onViewInYourSpace?: (plant: Plant) => void;
  onAutoArrangePlants?: (plants: Plant[]) => void;
  onDirectionChange?: (direction: string) => void;
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
  onViewInYourSpace,
  onAutoArrangePlants,
  onDirectionChange,
}) => {
  const currentCanonicalDir = normalizeVastuDirection(direction);
  const dirMetadata = getVastuDirectionMetadata(currentCanonicalDir);

  // STRICT VASTU FILTERING: Only show plants auspicious for the selected direction
  const vastuMatchingPlants = useMemo(() => {
    return filterPlantsByVastuDirection(plants, currentCanonicalDir);
  }, [plants, currentCanonicalDir]);

  // Recommendation Scoring Logic exclusively on the Vastu-compatible species
  const scoredRecommendations: RecommendationMatch[] = useMemo(() => {
    return vastuMatchingPlants.map((plant) => {
      let score = 50; // Base score for 100% Vastu alignment
      const reasons: string[] = [
        `Auspicous Vastu alignment: Sacred ${currentCanonicalDir} (${dirMetadata.sanskrit}) quadrant`
      ];

      // 1. Sunlight condition compatibility
      const pSun = plant.sunlight.toLowerCase();
      const curSun = sunlight.toLowerCase();
      let sunlightMatch = false;

      if (curSun === 'high' && (pSun.includes('high') || pSun.includes('full'))) {
        sunlightMatch = true;
        score += 25;
        reasons.push(`Optimal sunlight (Full exposure matches ${sunlight} illumination)`);
      } else if (curSun === 'medium' && (pSun.includes('medium') || pSun.includes('partial') || pSun.includes('filtered'))) {
        sunlightMatch = true;
        score += 25;
        reasons.push(`Optimal sunlight (Filtered light matches ${sunlight} illumination)`);
      } else if (curSun === 'low' && (pSun.includes('low') || pSun.includes('shade') || pSun.includes('indoor'))) {
        sunlightMatch = true;
        score += 25;
        reasons.push(`Tolerates partial shade conditions`);
      } else {
        score += 15;
        reasons.push(`Acceptable with strategic windowsill placement`);
      }

      // 2. Space compatibility
      const isSmall = plant.spaceRequired.toLowerCase().includes('small');
      let spaceMatch = true;
      if (spaceSqFt < 35 && !isSmall) {
        spaceMatch = false;
        score += 10;
        reasons.push(`Container pruning recommended in compact layout (${spaceSqFt} sq.ft)`);
      } else {
        spaceMatch = true;
        score += 15;
        reasons.push(`Space proportion (${plant.spaceRequired} matches layout)`);
      }

      // 3. Maintenance preference
      score += 10;

      return {
        plant,
        score: Math.min(99, score),
        reasons,
        vastuMatch: true,
        sunlightMatch,
        spaceMatch,
        maintenanceMatch: true,
      };
    }).sort((a, b) => b.score - a.score);
  }, [vastuMatchingPlants, currentCanonicalDir, sunlight, spaceSqFt, dirMetadata]);

  const allDirections = Object.keys(VASTU_DIRECTIONS);

  return (
    <div className="space-y-8 text-[#F4EFE6]">
      {/* Heading: “Plants chosen for your space” */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#D4AF37]/25 pb-6">
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase block">
            VASTU DIRECTIONAL HARMONY
          </span>
          <h2 className="text-3xl font-serif font-bold luxury-gold-text mt-0.5">
            Auspicious Plants for {currentCanonicalDir}
          </h2>
          <p className="text-xs text-[#A3C1AD] mt-1">
            Displaying only plants aligned with the traditional <strong className="text-[#F6D985]">{dirMetadata.sanskrit}</strong> ({dirMetadata.element}) energy quadrant.
          </p>
        </div>
        <div className="bg-[#0E281E] px-4 py-2 rounded-2xl border border-[#D4AF37]/30 shadow-xs text-xs text-[#A3C1AD] self-start sm:self-auto flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
          <span>Active: <strong className="text-[#F6D985]">{currentCanonicalDir}</strong> ({scoredRecommendations.length} available)</span>
        </div>
      </div>

      {/* Direction Selection Filter Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
            Select Vastu Direction:
          </span>
          <span className="text-[11px] text-[#A3C1AD]">
            Click any direction to reveal its exclusive Vastu plants
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allDirections.map((dirKey) => {
            const isSelected = dirKey === currentCanonicalDir;
            const meta = VASTU_DIRECTIONS[dirKey];
            return (
              <button
                key={dirKey}
                type="button"
                onClick={() => onDirectionChange && onDirectionChange(dirKey)}
                className={`py-2 px-3.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 ${
                  isSelected
                    ? 'luxury-btn-gold text-[#081711] font-bold shadow-md ring-2 ring-[#D4AF37]'
                    : 'bg-[#0E281E]/80 text-[#A3C1AD] hover:text-[#F4EFE6] hover:bg-[#0E281E] border border-[#D4AF37]/25'
                }`}
              >
                <span>{dirKey}</span>
                <span className={`text-[9px] ${isSelected ? 'text-[#081711]/70' : 'text-[#A3C1AD]/60'}`}>
                  • {meta.sanskrit.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Smart Auto-Arrangement Action Bar */}
      {onAutoArrangePlants && scoredRecommendations.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl luxury-card bg-[#0E281E]/90 border border-[#D4AF37]/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F6D985] shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 text-[#F6D985]" />
            </div>
            <div>
              <strong className="text-sm font-serif font-bold luxury-gold-text block">
                Automatic Vastu Botanical Arrangement
              </strong>
              <p className="text-xs text-[#A3C1AD] mt-0.5">
                Automatically stage the top {Math.min(4, scoredRecommendations.length)} recommended medicinal plants into auspicious {currentCanonicalDir} quadrants with verified clearance spacing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAutoArrangePlants(scoredRecommendations.slice(0, 4).map((r) => r.plant))}
            className="py-3 px-6 rounded-full luxury-btn-gold text-[#081711] font-bold text-xs tracking-wider transition shadow-lg shrink-0 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#081711]" />
            <span>Auto-Arrange Top Matches</span>
          </button>
        </div>
      )}

      {/* Empty State if no plants match this direction */}
      {scoredRecommendations.length === 0 && (
        <div className="py-16 text-center luxury-card bg-[#0B1D16]/90 rounded-[2.5rem] border border-[#D4AF37]/30 shadow-lg p-8 max-w-lg mx-auto space-y-4">
          <span className="text-4xl block">🧭</span>
          <h3 className="text-xl font-serif font-bold text-[#F4EFE6]">
            No Botanicals Found for {currentCanonicalDir}
          </h3>
          <p className="text-xs text-[#A3C1AD]">
            No recorded medicinal species match the {currentCanonicalDir} quadrant in this catalog. Select North-East, East, or North to explore our most auspicious healing flora.
          </p>
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            <button
              type="button"
              onClick={() => onDirectionChange && onDirectionChange('North-East')}
              className="py-2 px-4 rounded-full luxury-btn-gold text-[#081711] text-xs font-bold"
            >
              Switch to North-East (Ishanya)
            </button>
            <button
              type="button"
              onClick={() => onDirectionChange && onDirectionChange('East')}
              className="py-2 px-4 rounded-full luxury-btn-secondary text-[#F4EFE6] border border-[#D4AF37]/30 text-xs font-semibold"
            >
              Switch to East (Surya)
            </button>
          </div>
        </div>
      )}

      {/* Grid of Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scoredRecommendations.slice(0, 6).map((item) => {
          const { plant, score, reasons } = item;

          return (
            <div
              key={plant._id}
              className="luxury-card hover-lift rounded-[2rem] p-6 border border-[#D4AF37]/30 shadow-xl bg-[#0B1D16]/90 backdrop-blur-xl hover:border-[#D4AF37]/60 transition duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                {/* Header: Plant Photo + Score badge */}
                <div className="flex items-start gap-4">
                  <img
                    src={plant.image}
                    alt={plant.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-[#D4AF37]/30 shadow-sm shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="bg-[#D4AF37]/15 text-[#F6D985] border border-[#D4AF37]/35 text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
                        {plant.ayushSystem}
                      </span>
                      <span className="text-xs font-bold text-[#68D391] bg-[#0E281E] px-2.5 py-0.5 rounded-full border border-[#68D391]/35">
                        {score}% Match
                      </span>
                    </div>

                    <h3 className="text-lg font-serif font-bold luxury-gold-text truncate mt-1 uppercase">
                      {plant.name.split(' ')[0]}
                    </h3>
                    <p className="text-[11px] font-mono italic text-[#A3C1AD] truncate">
                      {plant.scientificName}
                    </p>
                  </div>
                </div>

                {/* Checklist (e.g. ✓ Suitable sunlight, ✓ Suitable space, etc.) */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-[#081711] border border-[#D4AF37]/20 text-xs">
                  {reasons.slice(0, 3).map((r, rIdx) => (
                    <div key={rIdx} className="flex items-start gap-2 text-[#F4EFE6]/90">
                      <Check className="w-3.5 h-3.5 text-[#68D391] shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-tight">{r}</span>
                    </div>
                  ))}
                </div>

                {/* Spec Indicators: Sunlight, Water, Vastu */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#A3C1AD]">
                  <div className="p-2 rounded-xl bg-[#0E281E]/80 border border-[#D4AF37]/20">
                    <span className="text-[9px] text-[#A3C1AD] uppercase block font-bold">Vastu Direction</span>
                    <strong className="text-[#F4EFE6]">{plant.vastuDirections[0]}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0E281E]/80 border border-[#D4AF37]/20">
                    <span className="text-[9px] text-[#A3C1AD] uppercase block font-bold">Care Difficulty</span>
                    <strong className="text-[#F4EFE6]">{plant.maintenanceLevel}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2 border-t border-[#D4AF37]/20">
                {onViewInYourSpace ? (
                  <button
                    type="button"
                    onClick={() => onViewInYourSpace(plant)}
                    className="w-full py-2.5 px-3 rounded-full luxury-btn-gold text-[#081711] text-xs font-bold transition duration-200 text-center shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#081711] animate-pulse" />
                    <span>View in Your Space (AR)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectPlantForGarden(plant)}
                    className="w-full py-2.5 px-3 rounded-full luxury-btn-gold text-[#081711] text-xs font-bold transition duration-200 text-center shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#081711]" />
                    <span>View in Your Space (AR)</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onViewPlantDetails(plant)}
                    className="flex-1 py-2 px-3 rounded-full luxury-btn-secondary text-xs font-semibold text-[#A3C1AD] hover:text-[#F4EFE6] transition duration-200 text-center"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectPlantForGarden(plant)}
                    className="flex-1 py-2 px-3 rounded-full luxury-btn-copper text-white text-xs font-semibold transition duration-200 text-center shadow-xs"
                  >
                    + Place in Garden
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ethical note */}
      <div className="text-[11px] text-[#A3C1AD]/70 italic text-center pt-2">
        * Vastu compatibility reflects traditional Indian cultural spatial planning and is not an empirical scientific claim.
      </div>
    </div>
  );
};
