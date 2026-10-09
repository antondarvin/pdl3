import mongoose from 'mongoose';

const plantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  scientificName: { type: String, required: true },
  family: { type: String, default: '' },
  ayushSystem: { 
    type: String, 
    required: true, 
    enum: ['Ayurveda', 'Yoga & Naturopathy', 'Unani', 'Siddha', 'Homeopathy'] 
  },
  description: { type: String, required: true },
  appearance: { type: String, required: true },
  height: { type: String, default: '' },
  growthHabit: { type: String, default: '' },
  suitableEnvironment: { type: String, default: '' },
  traditionalUses: { type: String, required: true },
  plantPartsUsed: [{ type: String }],
  traditionalPreparation: { type: String, default: '' },
  sunlight: { type: String, required: true },
  watering: { type: String, required: true },
  soil: { type: String, required: true },
  spaceRequired: { type: String, required: true },
  indoorOutdoor: { type: String, required: true },
  maintenanceLevel: { type: String, required: true },
  vastuDirections: [{ type: String }],
  vastuExplanation: { type: String, default: '' },
  precautions: { type: String, required: true },
  image: { type: String, required: true },
  model3D: {
    type: { type: String, default: 'herb' },
    potColor: { type: String, default: '#c25e37' },
    foliageColor: { type: String, default: '#2d6a4f' },
    flowerColor: { type: String, default: '#ffffff' },
    heightScale: { type: Number, default: 1.0 },
    leafDensity: { type: Number, default: 1.0 }
  },
  spacingRequiredFt: { type: Number, default: 1.5 },
  createdAt: { type: Date, default: Date.now }
});

export const Plant = mongoose.model('Plant', plantSchema);
