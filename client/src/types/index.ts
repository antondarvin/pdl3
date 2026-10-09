export type AyushCategory = 
  | 'Ayurveda' 
  | 'Yoga & Naturopathy' 
  | 'Unani' 
  | 'Siddha' 
  | 'Homeopathy';

export interface Plant3DModelConfig {
  type: string;
  potColor?: string;
  foliageColor?: string;
  flowerColor?: string;
  heightScale?: number;
  leafDensity?: number;
}

export interface Plant {
  _id: string;
  name: string;
  scientificName: string;
  family: string;
  ayushSystem: AyushCategory;
  description: string;
  appearance: string;
  height?: string;
  growthHabit?: string;
  suitableEnvironment?: string;
  traditionalUses: string;
  plantPartsUsed: string[];
  traditionalPreparation: string;
  sunlight: string;
  watering: string;
  soil: string;
  spaceRequired: string;
  indoorOutdoor: string;
  maintenanceLevel: string;
  vastuDirections: string[];
  vastuExplanation: string;
  precautions: string;
  image: string;
  model3D?: Plant3DModelConfig;
  spacingRequiredFt?: number; // Configurable recommended plant spacing in feet (e.g. 1.5 ft)
  minSpacingFt?: number; // Minimum safe spacing in feet
  spreadDiameterFt?: number; // Canopy spread in feet
  defaultPotDiameterFt?: number; // Suggested pot diameter
  sunlightTier?: 'High' | 'Medium' | 'Low';
  companionPlants?: string[];
}

export interface PlacedPlant {
  id: string;
  plantId: string;
  name: string;
  scientificName: string;
  image: string;
  x: number; // 0 to 100% or ft
  y: number; // 0 to 100% or ft
  rotation: number; // degrees
  scale: number; // 0.5 to 2.5
  model3D?: Plant3DModelConfig;
  potSizeFt?: number; // diameter in ft (e.g., 0.8 - 2.5)
  spacingRequiredFt?: number; // required clearance in ft
  plantHeightFt?: number; // rendered height in ft
}

export interface Garden {
  _id: string;
  userId: string;
  gardenName: string;
  roomType: string;
  length: number;
  width: number;
  direction: string;
  plants: PlacedPlant[];
  notes?: string;
  unit?: 'ft' | 'm';
  totalSquareFeet?: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  notificationPreferences?: {
    wateringReminders: boolean;
    seasonalTips: boolean;
    quizChallenges: boolean;
  };
  termsAccepted: boolean;
  createdAt: string;
}

export interface UserStats {
  plantsExplored: number;
  plantsSaved: number;
  gardenDesigns: number;
  quizScore: string;
  quizzesTaken: number;
}

export interface UserActivity {
  _id: string;
  type: string;
  details: string;
  timestamp: string;
}

export interface QuizQuestion {
  _id: string;
  question: string;
  type: 'multiple-choice' | 'plant-identification' | 'true-false';
  image?: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  ayushCategory: string;
}

export interface QuizResult {
  _id: string;
  userId: string;
  score: number;
  totalQuestions: number;
  category: string;
  completedAt: string;
}

export interface RecommendationMatch {
  plant: Plant;
  score: number;
  reasons: string[];
  vastuMatch: boolean;
  sunlightMatch: boolean;
  spaceMatch: boolean;
  maintenanceMatch: boolean;
}
