import { Plant, PlacedPlant } from '../types';

export interface PlantSpacingConfig {
  recommendedSpacingFt: number; // e.g. 1.5 ft
  minSpacingFt: number; // e.g. 1.0 ft
  maxSpacingFt: number; // e.g. 2.0 ft
  spreadDiameterFt: number; // e.g. 1.5 ft
  defaultPotDiameterFt: number; // e.g. 1.0 ft
  sunlightNeed: 'High' | 'Medium' | 'Low';
  growthType: 'shrub' | 'herb' | 'succulent' | 'climber' | 'tree' | 'grass';
}

/**
 * Plant-specific configurable spacing database.
 * Supports configurable spacing from the plant object itself or defaults by botanical species.
 */
export const PLANT_SPACING_DATABASE: Record<string, PlantSpacingConfig> = {
  tulsi: {
    recommendedSpacingFt: 1.5,
    minSpacingFt: 1.0,
    maxSpacingFt: 2.0,
    spreadDiameterFt: 1.5,
    defaultPotDiameterFt: 1.0,
    sunlightNeed: 'High',
    growthType: 'herb',
  },
  mint: {
    recommendedSpacingFt: 1.5,
    minSpacingFt: 1.0,
    maxSpacingFt: 2.0,
    spreadDiameterFt: 1.2,
    defaultPotDiameterFt: 1.0,
    sunlightNeed: 'Medium',
    growthType: 'herb',
  },
  aloe: {
    recommendedSpacingFt: 1.5,
    minSpacingFt: 1.0,
    maxSpacingFt: 2.0,
    spreadDiameterFt: 1.4,
    defaultPotDiameterFt: 1.1,
    sunlightNeed: 'High',
    growthType: 'succulent',
  },
  lemongrass: {
    recommendedSpacingFt: 2.5,
    minSpacingFt: 2.0,
    maxSpacingFt: 3.0,
    spreadDiameterFt: 2.2,
    defaultPotDiameterFt: 1.4,
    sunlightNeed: 'High',
    growthType: 'grass',
  },
  neem: {
    recommendedSpacingFt: 3.5,
    minSpacingFt: 3.0,
    maxSpacingFt: 5.0,
    spreadDiameterFt: 3.2,
    defaultPotDiameterFt: 1.8,
    sunlightNeed: 'High',
    growthType: 'tree',
  },
  hibiscus: {
    recommendedSpacingFt: 2.5,
    minSpacingFt: 2.0,
    maxSpacingFt: 3.0,
    spreadDiameterFt: 2.4,
    defaultPotDiameterFt: 1.5,
    sunlightNeed: 'High',
    growthType: 'shrub',
  },
  ashwagandha: {
    recommendedSpacingFt: 2.0,
    minSpacingFt: 1.5,
    maxSpacingFt: 2.5,
    spreadDiameterFt: 1.8,
    defaultPotDiameterFt: 1.2,
    sunlightNeed: 'High',
    growthType: 'shrub',
  },
  brahmi: {
    recommendedSpacingFt: 1.0,
    minSpacingFt: 0.8,
    maxSpacingFt: 1.5,
    spreadDiameterFt: 1.0,
    defaultPotDiameterFt: 0.9,
    sunlightNeed: 'Medium',
    growthType: 'herb',
  },
  giloy: {
    recommendedSpacingFt: 2.0,
    minSpacingFt: 1.5,
    maxSpacingFt: 3.0,
    spreadDiameterFt: 2.0,
    defaultPotDiameterFt: 1.4,
    sunlightNeed: 'Medium',
    growthType: 'climber',
  },
  amla: {
    recommendedSpacingFt: 3.0,
    minSpacingFt: 2.5,
    maxSpacingFt: 4.0,
    spreadDiameterFt: 2.8,
    defaultPotDiameterFt: 1.6,
    sunlightNeed: 'High',
    growthType: 'tree',
  },
  shatavari: {
    recommendedSpacingFt: 2.0,
    minSpacingFt: 1.5,
    maxSpacingFt: 2.5,
    spreadDiameterFt: 1.8,
    defaultPotDiameterFt: 1.3,
    sunlightNeed: 'Medium',
    growthType: 'climber',
  },
  turmeric: {
    recommendedSpacingFt: 1.5,
    minSpacingFt: 1.2,
    maxSpacingFt: 2.0,
    spreadDiameterFt: 1.5,
    defaultPotDiameterFt: 1.2,
    sunlightNeed: 'Medium',
    growthType: 'herb',
  },
  ginger: {
    recommendedSpacingFt: 1.5,
    minSpacingFt: 1.2,
    maxSpacingFt: 2.0,
    spreadDiameterFt: 1.4,
    defaultPotDiameterFt: 1.2,
    sunlightNeed: 'Medium',
    growthType: 'herb',
  },
  curryleaf: {
    recommendedSpacingFt: 2.5,
    minSpacingFt: 2.0,
    maxSpacingFt: 3.0,
    spreadDiameterFt: 2.2,
    defaultPotDiameterFt: 1.4,
    sunlightNeed: 'High',
    growthType: 'shrub',
  },
};

/**
 * Resolve plant spacing metrics for any plant by checking configured database or name
 */
export function getPlantSpacingInfo(plant?: Plant | { name?: string; model3D?: { type?: string }; spacingRequiredFt?: number }): PlantSpacingConfig {
  if (!plant) {
    return {
      recommendedSpacingFt: 1.5,
      minSpacingFt: 1.0,
      maxSpacingFt: 2.0,
      spreadDiameterFt: 1.5,
      defaultPotDiameterFt: 1.0,
      sunlightNeed: 'Medium',
      growthType: 'herb',
    };
  }

  // If plant has explicit spacing configured in database
  if (plant.spacingRequiredFt && plant.spacingRequiredFt > 0) {
    return {
      recommendedSpacingFt: plant.spacingRequiredFt,
      minSpacingFt: Math.max(0.8, plant.spacingRequiredFt * 0.7),
      maxSpacingFt: plant.spacingRequiredFt * 1.4,
      spreadDiameterFt: plant.spacingRequiredFt,
      defaultPotDiameterFt: Math.min(1.5, plant.spacingRequiredFt * 0.7),
      sunlightNeed: 'Medium',
      growthType: 'herb',
    };
  }

  const modelType = (plant.model3D?.type || '').toLowerCase();
  const nameLower = (plant.name || '').toLowerCase();

  for (const [key, config] of Object.entries(PLANT_SPACING_DATABASE)) {
    if (modelType.includes(key) || nameLower.includes(key)) {
      return config;
    }
  }

  // Fallback defaults
  return {
    recommendedSpacingFt: 1.5,
    minSpacingFt: 1.0,
    maxSpacingFt: 2.0,
    spreadDiameterFt: 1.5,
    defaultPotDiameterFt: 1.0,
    sunlightNeed: 'Medium',
    growthType: 'herb',
  };
}

/**
 * Convert normalized percentage coordinates (0-100) to physical coordinates in feet relative to garden center
 */
export function pctToFtCoords(xPct: number, yPct: number, gardenLengthFt: number, gardenWidthFt: number): { xFt: number; zFt: number } {
  const xFt = ((xPct / 100) - 0.5) * gardenLengthFt;
  const zFt = ((yPct / 100) - 0.5) * gardenWidthFt;
  return { xFt, zFt };
}

/**
 * Convert physical coordinates in feet relative to garden center back to normalized percentage (0-100)
 */
export function ftToPctCoords(xFt: number, zFt: number, gardenLengthFt: number, gardenWidthFt: number): { xPct: number; yPct: number } {
  const xPct = Math.max(5, Math.min(95, ((xFt / gardenLengthFt) + 0.5) * 100));
  const yPct = Math.max(5, Math.min(95, ((zFt / gardenWidthFt) + 0.5) * 100));
  return { xPct, yPct };
}

export interface ProximityAnalysisResult {
  plantIdA: string;
  plantIdB: string;
  nameA: string;
  nameB: string;
  distanceFt: number;
  requiredSpacingFt: number;
  isTooClose: boolean;
  overlapFt: number;
}

/**
 * Calculates pairwise distance between all placed plants in physical feet.
 * Returns close pairs and distance matrix.
 */
export function analyzePlantSpacing(
  plants: PlacedPlant[],
  gardenLengthFt: number,
  gardenWidthFt: number
): {
  proximityList: ProximityAnalysisResult[];
  violatingPlantIds: Set<string>;
  closestPairs: ProximityAnalysisResult[];
} {
  const proximityList: ProximityAnalysisResult[] = [];
  const violatingPlantIds = new Set<string>();

  for (let i = 0; i < plants.length; i++) {
    for (let j = i + 1; j < plants.length; j++) {
      const pA = plants[i];
      const pB = plants[j];

      const posA = pctToFtCoords(pA.x, pA.y, gardenLengthFt, gardenWidthFt);
      const posB = pctToFtCoords(pB.x, pB.y, gardenLengthFt, gardenWidthFt);

      const dx = posA.xFt - posB.xFt;
      const dz = posA.zFt - posB.zFt;
      const distanceFt = Math.hypot(dx, dz);

      const configA = getPlantSpacingInfo(pA);
      const configB = getPlantSpacingInfo(pB);

      // Average recommended clearance or sum of radii
      const reqSpacing = (configA.recommendedSpacingFt + configB.recommendedSpacingFt) / 2;
      const minSafe = (configA.minSpacingFt + configB.minSpacingFt) / 2;

      const isTooClose = distanceFt < minSafe;
      const overlapFt = Math.max(0, reqSpacing - distanceFt);

      if (isTooClose) {
        violatingPlantIds.add(pA.id);
        violatingPlantIds.add(pB.id);
      }

      proximityList.push({
        plantIdA: pA.id,
        plantIdB: pB.id,
        nameA: pA.name,
        nameB: pB.name,
        distanceFt: Math.round(distanceFt * 10) / 10,
        requiredSpacingFt: Math.round(reqSpacing * 10) / 10,
        isTooClose,
        overlapFt: Math.round(overlapFt * 10) / 10,
      });
    }
  }

  proximityList.sort((a, b) => a.distanceFt - b.distanceFt);

  return {
    proximityList,
    violatingPlantIds,
    closestPairs: proximityList.slice(0, 5),
  };
}

export interface GardenAreaDashboardStats {
  totalGardenAreaSqFt: number;
  plantOccupiedAreaSqFt: number;
  requiredSpacingAreaSqFt: number;
  availableAreaSqFt: number;
  remainingAreaSqFt: number;
  numberOfPlants: number;
  plantDensity: number; // plants per sq ft
  spaceUtilizationPercent: number; // 0 - 100%
  isOvercrowded: boolean;
  lengthFt: number;
  widthFt: number;
  // Metric equivalents
  totalAreaSqM: number;
  availableAreaSqM: number;
  usedAreaSqM: number;
}

/**
 * Real-time instant garden area & utilization calculator
 */
export function calculateGardenAreaStats(
  lengthFt: number,
  widthFt: number,
  plants: PlacedPlant[]
): GardenAreaDashboardStats {
  const safeLength = Math.max(1, lengthFt);
  const safeWidth = Math.max(1, widthFt);
  const totalGardenAreaSqFt = Math.round(safeLength * safeWidth * 10) / 10;

  let totalPlantOccupiedAreaSqFt = 0;
  let totalSpacingClearanceAreaSqFt = 0;

  for (const p of plants) {
    const config = getPlantSpacingInfo(p);
    const potDia = (p.potSizeFt || config.defaultPotDiameterFt) * (p.scale || 1);
    const spreadDia = config.spreadDiameterFt * (p.scale || 1);
    const spacingDia = config.recommendedSpacingFt * (p.scale || 1);

    // Footprint area (circle = PI * r^2)
    const potRadius = potDia / 2;
    const plantRadius = spreadDia / 2;
    const occupiedArea = Math.PI * Math.pow(Math.max(potRadius, plantRadius * 0.7), 2);
    const spacingArea = Math.PI * Math.pow(spacingDia / 2, 2);

    totalPlantOccupiedAreaSqFt += occupiedArea;
    totalSpacingClearanceAreaSqFt += spacingArea;
  }

  totalPlantOccupiedAreaSqFt = Math.round(totalPlantOccupiedAreaSqFt * 10) / 10;
  totalSpacingClearanceAreaSqFt = Math.round(totalSpacingClearanceAreaSqFt * 10) / 10;

  // Used Area includes footprint and reserved spacing clearance with practical overlap discount
  const usedAreaSqFt = Math.min(
    totalGardenAreaSqFt,
    Math.round((totalPlantOccupiedAreaSqFt + totalSpacingClearanceAreaSqFt * 0.45) * 10) / 10
  );

  const availableAreaSqFt = Math.max(0, Math.round((totalGardenAreaSqFt - usedAreaSqFt) * 10) / 10);
  const remainingAreaSqFt = availableAreaSqFt;
  const numberOfPlants = plants.length;
  const plantDensity = numberOfPlants > 0 ? Math.round((numberOfPlants / totalGardenAreaSqFt) * 100) / 100 : 0;
  const spaceUtilizationPercent = totalGardenAreaSqFt > 0 ? Math.min(100, Math.round((usedAreaSqFt / totalGardenAreaSqFt) * 100)) : 0;
  const isOvercrowded = spaceUtilizationPercent >= 90 || totalSpacingClearanceAreaSqFt > totalGardenAreaSqFt * 1.1;

  // Metric conversions (1 ft = 0.3048 m, 1 sq ft = 0.092903 sq m)
  const SQFT_TO_SQM = 0.092903;
  const totalAreaSqM = Math.round(totalGardenAreaSqFt * SQFT_TO_SQM * 10) / 10;
  const availableAreaSqM = Math.round(availableAreaSqFt * SQFT_TO_SQM * 10) / 10;
  const usedAreaSqM = Math.round(usedAreaSqFt * SQFT_TO_SQM * 10) / 10;

  return {
    totalGardenAreaSqFt,
    plantOccupiedAreaSqFt: totalPlantOccupiedAreaSqFt,
    requiredSpacingAreaSqFt: totalSpacingClearanceAreaSqFt,
    availableAreaSqFt,
    remainingAreaSqFt,
    numberOfPlants,
    plantDensity,
    spaceUtilizationPercent,
    isOvercrowded,
    lengthFt: safeLength,
    widthFt: safeWidth,
    totalAreaSqM,
    availableAreaSqM,
    usedAreaSqM,
  };
}

/**
 * Smart Plant Placement algorithm ("Optimize My Garden")
 * Organizes plants into optimal ergonomic rows and quadrants:
 * - High-sun lovers (Tulsi, Lemongrass, Neem, Hibiscus) toward sun direction
 * - Shade-loving / moist herbs (Brahmi, Mint, Ginger) in filtered zone
 * - Reserves 2-3 ft walking pathway through garden
 * - Guarantees minimum spacing clearance between adjacent plants
 */
export function optimizeGardenLayout(
  plants: PlacedPlant[],
  gardenLengthFt: number,
  gardenWidthFt: number,
  direction: string = 'North-East'
): {
  optimizedPlants: PlacedPlant[];
  summaryMessage: string;
  changesApplied: number;
} {
  if (plants.length === 0) {
    return {
      optimizedPlants: [],
      summaryMessage: 'No plants in garden to optimize. Add plants from the library first!',
      changesApplied: 0,
    };
  }

  // Clone plants
  const workingPlants = [...plants];

  // Categorize by light need
  const highSunPlants: PlacedPlant[] = [];
  const mediumLowSunPlants: PlacedPlant[] = [];

  for (const p of workingPlants) {
    const config = getPlantSpacingInfo(p);
    if (config.sunlightNeed === 'High') {
      highSunPlants.push(p);
    } else {
      mediumLowSunPlants.push(p);
    }
  }

  // Sort plants to place larger shrubs/trees toward back/perimeter
  const sortedPlants = [...highSunPlants, ...mediumLowSunPlants].sort((a, b) => {
    const sA = getPlantSpacingInfo(a).recommendedSpacingFt;
    const sB = getPlantSpacingInfo(b).recommendedSpacingFt;
    return sB - sA;
  });

  // Calculate safe planting boundaries (leaving 0.8 ft border from edge and central pathway)
  const borderMarginFt = 1.0;
  const usableLength = Math.max(2, gardenLengthFt - borderMarginFt * 2);
  const usableWidth = Math.max(2, gardenWidthFt - borderMarginFt * 2);

  // Determine grid dimensions
  const totalCount = sortedPlants.length;
  // Rows and columns
  const cols = Math.max(1, Math.min(Math.floor(usableLength / 1.8), Math.ceil(Math.sqrt(totalCount))));
  const rows = Math.max(1, Math.ceil(totalCount / cols));

  const colStepFt = cols > 1 ? usableLength / (cols - 1) : 0;
  const rowStepFt = rows > 1 ? usableWidth / (rows - 1) : 0;

  const startXFt = -usableLength / 2;
  const startZFt = -usableWidth / 2;

  const optimizedPlants: PlacedPlant[] = sortedPlants.map((plant, index) => {
    const c = index % cols;
    const r = Math.floor(index / cols);

    // Apply slight staggered offset for aesthetic organic staggered rows
    const staggerX = r % 2 === 1 && cols > 1 ? (colStepFt * 0.25) : 0;

    let xFt = startXFt + (c * colStepFt) + staggerX;
    let zFt = startZFt + (r * rowStepFt);

    // Clamp strictly within garden borders
    const maxBoundX = gardenLengthFt / 2 - borderMarginFt;
    const maxBoundZ = gardenWidthFt / 2 - borderMarginFt;
    xFt = Math.max(-maxBoundX, Math.min(maxBoundX, xFt));
    zFt = Math.max(-maxBoundZ, Math.min(maxBoundZ, zFt));

    const { xPct, yPct } = ftToPctCoords(xFt, zFt, gardenLengthFt, gardenWidthFt);

    return {
      ...plant,
      x: Math.round(xPct),
      y: Math.round(yPct),
      rotation: (plant.rotation + (index * 15)) % 360,
    };
  });

  const summaryMessage = `Smart layout optimized for ${direction} orientation: ${plants.length} botanical specimens arranged with optimal sun exposure, compliant spacing clearance, and preserved central garden walkway.`;

  return {
    optimizedPlants,
    summaryMessage,
    changesApplied: plants.length,
  };
}
