import { Plant } from '../types';
import { normalizeVastuDirection, isPlantVastuCompatible, getVastuDirectionMetadata } from './vastuRules';

export interface SpotSuitabilityResult {
  overallScore: number; // 0 - 100
  status: 'optimal' | 'moderate' | 'unsuitable';
  vastuMatch: boolean;
  vastuScore: number; // 0 - 40
  currentDirection: string;
  targetDirections: string[];
  vastuGuidance: string;
  turnSuggestion?: string;
  lightMatch: boolean;
  lightScore: number; // 0 - 35
  lightLevelDetected: 'High' | 'Medium' | 'Low';
  lightGuidance: string;
  surfaceScore: number; // 0 - 25
  surfaceGuidance: string;
  hudHeadline: string;
  hudSubtitle: string;
  reticleHexColor: number;
  reticleDiskColor: number;
  badgeClass: string;
}

// Direction compass degree centers
const DIRECTION_DEG_MAP: Record<string, number> = {
  'North': 0,
  'North-East': 45,
  'East': 90,
  'South-East': 135,
  'South': 180,
  'South-West': 225,
  'West': 270,
  'North-West': 315,
};

/**
 * Calculates shortest angular turn in degrees from current heading to target heading.
 */
export function getAngularDifference(currentDeg: number, targetDeg: number): number {
  let diff = (targetDeg - currentDeg + 180) % 360 - 180;
  return diff < -180 ? diff + 360 : diff;
}

/**
 * Evaluates real-time camera placement suitability for a specific plant.
 */
export function evaluatePlacementSuitability(
  plant: Plant,
  options: {
    compassHeading: number;
    lightLuma?: number; // 0-255 from camera pixels
    manualSunlight?: 'High' | 'Medium' | 'Low';
    surfaceDistanceM?: number;
    spaceType?: 'Indoor' | 'Balcony' | 'Terrace' | 'Outdoor';
  }
): SpotSuitabilityResult {
  const { compassHeading, lightLuma = 140, manualSunlight, spaceType = 'Balcony' } = options;

  // 1. Current Direction calculation from heading
  const deg = (compassHeading + 360) % 360;
  let currentDir = 'North';
  if (deg >= 22.5 && deg < 67.5) currentDir = 'North-East';
  else if (deg >= 67.5 && deg < 112.5) currentDir = 'East';
  else if (deg >= 112.5 && deg < 157.5) currentDir = 'South-East';
  else if (deg >= 157.5 && deg < 202.5) currentDir = 'South';
  else if (deg >= 202.5 && deg < 247.5) currentDir = 'South-West';
  else if (deg >= 247.5 && deg < 292.5) currentDir = 'West';
  else if (deg >= 292.5 && deg < 337.5) currentDir = 'North-West';

  const canonicalCurrentDir = normalizeVastuDirection(currentDir);
  const currentDirMeta = getVastuDirectionMetadata(canonicalCurrentDir);

  // 2. Vastu Alignment Evaluation (Max 40 points)
  const vastuMatch = isPlantVastuCompatible(plant, canonicalCurrentDir);
  let vastuScore = 0;
  let turnSuggestion: string | undefined = undefined;

  const targetDirs = plant.vastuDirections || ['North-East'];
  const primaryTarget = targetDirs[0] || 'North-East';

  if (vastuMatch) {
    vastuScore = 40;
  } else {
    // Find closest target direction
    let minAbsDiff = 360;
    let bestTargetDir = primaryTarget;
    let bestDiffSigned = 0;

    targetDirs.forEach((td) => {
      const canonicalTd = normalizeVastuDirection(td);
      const targetDeg = DIRECTION_DEG_MAP[canonicalTd] ?? 45;
      const diff = getAngularDifference(deg, targetDeg);
      if (Math.abs(diff) < minAbsDiff) {
        minAbsDiff = Math.abs(diff);
        bestTargetDir = canonicalTd;
        bestDiffSigned = diff;
      }
    });

    // Score falls off with distance from auspicious quadrant
    vastuScore = Math.max(8, Math.round(40 - (minAbsDiff / 180) * 35));

    const directionName = bestDiffSigned > 0 ? 'Right / Clockwise' : 'Left / Counter-clockwise';
    turnSuggestion = `Turn ${Math.round(Math.abs(bestDiffSigned))}° ${directionName} towards ${bestTargetDir}`;
  }

  const vastuGuidance = vastuMatch
    ? `Aligned with auspicious ${canonicalCurrentDir} (${currentDirMeta.sanskrit}) for ${plant.name}.`
    : turnSuggestion
    ? `${turnSuggestion} for traditional Vastu resonance.`
    : `Inauspicious quadrant for ${plant.name}.`;

  // 3. Lighting & Solar Radiance Evaluation (Max 35 points)
  let detectedLevel: 'High' | 'Medium' | 'Low' = 'Medium';
  if (lightLuma >= 160) detectedLevel = 'High';
  else if (lightLuma <= 85) detectedLevel = 'Low';
  else detectedLevel = manualSunlight || 'Medium';

  const plantSun = (plant.sunlight || 'High').toLowerCase();
  let lightScore = 15;
  let lightMatch = false;
  let lightGuidance = '';

  if (plantSun.includes('high') || plantSun.includes('full') || plantSun.includes('direct')) {
    if (detectedLevel === 'High') {
      lightScore = 35;
      lightMatch = true;
      lightGuidance = 'Bright sunlight detected: Perfect for high solar energy absorption.';
    } else if (detectedLevel === 'Medium') {
      lightScore = 24;
      lightMatch = false;
      lightGuidance = 'Moderate light detected: Move closer to window or balcony for optimal growth.';
    } else {
      lightScore = 10;
      lightMatch = false;
      lightGuidance = 'Dim spot detected: This species requires direct sunlight. Seek a brighter area.';
    }
  } else if (plantSun.includes('medium') || plantSun.includes('partial') || plantSun.includes('filtered')) {
    if (detectedLevel === 'Medium') {
      lightScore = 35;
      lightMatch = true;
      lightGuidance = 'Gentle filtered light: Ideal balance for this species.';
    } else if (detectedLevel === 'High') {
      lightScore = 26;
      lightMatch = true;
      lightGuidance = 'Bright area: Ensure delicate leaves are shielded from harsh midday scorching.';
    } else {
      lightScore = 16;
      lightMatch = false;
      lightGuidance = 'Low light: Move closer to indirect natural light source.';
    }
  } else {
    // Low light / shade
    if (detectedLevel === 'Low' || detectedLevel === 'Medium') {
      lightScore = 35;
      lightMatch = true;
      lightGuidance = 'Calm ambient lighting matches low light preference.';
    } else {
      lightScore = 20;
      lightMatch = false;
      lightGuidance = 'Direct light may cause foliage stress; partial shade preferred.';
    }
  }

  // 4. Spatial Clearance & Surface Grounding (Max 25 points)
  let surfaceScore = 25;
  let surfaceGuidance = 'Solid surface plane with clear 360° perimeter detected.';

  if (spaceType === 'Indoor' && plant.indoorOutdoor.toLowerCase().includes('outdoor') && !plant.indoorOutdoor.toLowerCase().includes('both')) {
    surfaceScore -= 10;
    surfaceGuidance = 'Outdoor species placed indoors. Ensure ample fresh air ventilation.';
  }

  // 5. Overall Synthesis
  const overallScore = Math.min(100, Math.max(10, vastuScore + lightScore + surfaceScore));

  let status: 'optimal' | 'moderate' | 'unsuitable' = 'unsuitable';
  let hudHeadline = '';
  let hudSubtitle = '';
  let reticleHexColor = 0xef4444; // Red
  let reticleDiskColor = 0xb91c1c;
  let badgeClass = 'border-red-500/50 bg-[#160B0B]/95 text-red-300';

  if (overallScore >= 75 && vastuMatch) {
    status = 'optimal';
    hudHeadline = '✨ OPTIMAL BOTANICAL SPOT DETECTED';
    hudSubtitle = `Perfect Vastu harmony (${canonicalCurrentDir}) & ideal light for ${plant.name}.`;
    reticleHexColor = 0x10b981; // Emerald Green
    reticleDiskColor = 0x059669;
    badgeClass = 'border-[#68D391]/60 bg-[#0E281E]/95 text-[#68D391] shadow-lg shadow-[#68D391]/20';
  } else if (overallScore >= 50) {
    status = 'moderate';
    hudHeadline = '⚠️ VIABLE SPOT (WITH ADJUSTMENTS)';
    hudSubtitle = turnSuggestion || lightGuidance;
    reticleHexColor = 0xf59e0b; // Amber
    reticleDiskColor = 0xd97706;
    badgeClass = 'border-[#D4AF37]/50 bg-[#0B1D16]/95 text-[#F6D985]';
  } else {
    status = 'unsuitable';
    hudHeadline = '❌ INAUSPICIOUS / UNSUITABLE ZONE';
    hudSubtitle = turnSuggestion || 'Move camera towards auspicious direction for this plant.';
    reticleHexColor = 0xef4444; // Crimson Red
    reticleDiskColor = 0xdc2626;
    badgeClass = 'border-red-500/50 bg-[#160B0B]/95 text-red-300';
  }

  return {
    overallScore,
    status,
    vastuMatch,
    vastuScore,
    currentDirection: canonicalCurrentDir,
    targetDirections: targetDirs,
    vastuGuidance,
    turnSuggestion,
    lightMatch,
    lightScore,
    lightLevelDetected: detectedLevel,
    lightGuidance,
    surfaceScore,
    surfaceGuidance,
    hudHeadline,
    hudSubtitle,
    reticleHexColor,
    reticleDiskColor,
    badgeClass,
  };
}

/**
 * Samples real video frame perceived luminance (0-255) using an offscreen canvas.
 */
export function sampleVideoLuminance(video: HTMLVideoElement | null): number {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return 140;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 140;

    ctx.drawImage(video, 0, 0, 32, 32);
    const imgData = ctx.getImageData(0, 0, 32, 32).data;

    let totalLuma = 0;
    const pixels = imgData.length / 4;

    for (let i = 0; i < imgData.length; i += 4) {
      // Rec. 709 perceived luminance
      const luma = 0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2];
      totalLuma += luma;
    }

    return Math.round(totalLuma / pixels);
  } catch {
    return 140;
  }
}
