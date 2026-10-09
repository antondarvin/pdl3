import { Plant } from '../types';

export interface VastuDirectionInfo {
  name: string;
  sanskrit: string;
  element: string;
  deity: string;
  significance: string;
  energyType: string;
  colorHex: string;
}

export const VASTU_DIRECTIONS: Record<string, VastuDirectionInfo> = {
  'North-East': {
    name: 'North-East',
    sanskrit: 'Ishanya (ईशान्य)',
    element: 'Water & Ether (Jal / Akasha)',
    deity: 'Lord Shiva & Brihaspati',
    significance: 'Zone of supreme spiritual clarity, divine wisdom, and calm healing energy.',
    energyType: 'Sacred Sattvic & Prana Gateway',
    colorHex: '#68D391',
  },
  'North': {
    name: 'North',
    sanskrit: 'Uttara / Kuber (उत्तर)',
    element: 'Water & Mercury (Budha)',
    deity: 'Lord Kuber (Lord of Wealth)',
    significance: 'Governs prosperity, career growth, mental rejuvenation, and vitality.',
    energyType: 'Abundance & Intellectual Clarity',
    colorHex: '#63B3ED',
  },
  'East': {
    name: 'East',
    sanskrit: 'Purva / Surya (पूर्व)',
    element: 'Solar Light & Fire (Agni / Surya)',
    deity: 'Lord Indra & Surya Dev',
    significance: 'Receives auspicious morning sunrise photons, revitalizing health and life force.',
    energyType: 'Vitality, Renewal & Longevity',
    colorHex: '#F6AD55',
  },
  'South-East': {
    name: 'South-East',
    sanskrit: 'Agneya (आग्नेय)',
    element: 'Pure Fire (Agni Tattva)',
    deity: 'Agni Dev & Shukra (Venus)',
    significance: 'Governs metabolism, internal digestive fire (Jatharagni), and warm energy.',
    energyType: 'Thermal Vigor & Metabolism',
    colorHex: '#FC8181',
  },
  'South': {
    name: 'South',
    sanskrit: 'Dakshina / Yama (दक्षिण)',
    element: 'Earth & Fire (Mangala / Mars)',
    deity: 'Yama Dev & Mangal',
    significance: 'Best for sturdy root botanicals requiring direct southern sunlight.',
    energyType: 'Grounding Resilience & Strength',
    colorHex: '#E53E3E',
  },
  'South-West': {
    name: 'South-West',
    sanskrit: 'Nairrutya (नैऋत्य)',
    element: 'Heavy Earth (Prithvi Tattva)',
    deity: 'Nirriti & Rahu',
    significance: 'Anchor zone of home stability. Suits hardy, deep-rooted protective plants.',
    energyType: 'Stability, Anchorage & Protection',
    colorHex: '#DD6B20',
  },
  'West': {
    name: 'West',
    sanskrit: 'Pashchima / Varuna (पश्चिम)',
    element: 'Water & Air (Shani / Saturn)',
    deity: 'Lord Varuna (Lord of Water & Oceans)',
    significance: 'Governs gains, social fulfillment, and evening twilight illumination.',
    energyType: 'Fulfillment & Structured Balance',
    colorHex: '#9F7AEA',
  },
  'North-West': {
    name: 'North-West',
    sanskrit: 'Vayavya (वायव्य)',
    element: 'Cosmic Air & Wind (Vayu Tattva)',
    deity: 'Vayu Dev & Chandra (Moon)',
    significance: 'Governs circulation, aromatic cross-breezes, and respiratory wellness.',
    energyType: 'Aromatic Flow & Respiratory Health',
    colorHex: '#4FD1C5',
  },
};

/**
 * Normalizes any direction string representation (e.g., "northeast", "NE", "North East", "north-east")
 * into the canonical Vastu direction key (e.g. "North-East").
 */
export function normalizeVastuDirection(dir: string | undefined | null): string {
  if (!dir) return 'North-East';
  const clean = dir.toLowerCase().trim().replace(/[\s\-_]/g, '');

  switch (clean) {
    case 'ne':
    case 'northeast':
    case 'ishanya':
      return 'North-East';
    case 'n':
    case 'north':
    case 'uttara':
      return 'North';
    case 'e':
    case 'east':
    case 'purva':
      return 'East';
    case 'se':
    case 'southeast':
    case 'agneya':
      return 'South-East';
    case 's':
    case 'south':
    case 'dakshina':
      return 'South';
    case 'sw':
    case 'southwest':
    case 'nairrutya':
      return 'South-West';
    case 'w':
    case 'west':
    case 'pashchima':
      return 'West';
    case 'nw':
    case 'northwest':
    case 'vayavya':
      return 'North-West';
    default:
      return dir;
  }
}

/**
 * Checks whether a given plant is compatible with the specified direction under Vastu Shastra rules.
 */
export function isPlantVastuCompatible(plant: Plant | null | undefined, direction: string | undefined): boolean {
  if (!plant || !plant.vastuDirections || plant.vastuDirections.length === 0) return false;
  if (!direction || direction.toLowerCase() === 'all') return true;

  const targetNorm = normalizeVastuDirection(direction);

  return plant.vastuDirections.some((d) => {
    return normalizeVastuDirection(d) === targetNorm;
  });
}

/**
 * Filters a list of plants so that ONLY the available plants compatible with the selected direction based on Vastu are returned.
 */
export function filterPlantsByVastuDirection(plants: Plant[], direction: string | undefined): Plant[] {
  if (!plants || plants.length === 0) return [];
  if (!direction || direction.toLowerCase() === 'all') return plants;

  const targetCanonical = normalizeVastuDirection(direction);

  return plants.filter((plant) => isPlantVastuCompatible(plant, targetCanonical));
}

/**
 * Retrieve Vastu metadata for a given direction.
 */
export function getVastuDirectionMetadata(direction: string): VastuDirectionInfo {
  const canonical = normalizeVastuDirection(direction);
  return (
    VASTU_DIRECTIONS[canonical] || {
      name: canonical,
      sanskrit: 'Disha',
      element: 'Pancha Mahabhutas',
      deity: 'Dikpala',
      significance: 'Traditional spatial alignment.',
      energyType: 'Balanced Energy',
      colorHex: '#D4AF37',
    }
  );
}
