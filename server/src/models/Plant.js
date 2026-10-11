import mongoose from 'mongoose';
import { stringId } from './_id.js';

const plantSchema = new mongoose.Schema({
  _id: stringId('plant'),
  name: { type: String, required: true, index: true },
  scientificName: { type: String, required: true },
  family: { type: String, default: '' },
  ayushSystem: { type: String, required: true, index: true },
  description: { type: String, default: '' },
  appearance: { type: String, default: '' },
  height: { type: String, default: '' },
  growthHabit: { type: String, default: '' },
  suitableEnvironment: { type: String, default: '' },
  traditionalUses: { type: String, default: '' },
  plantPartsUsed: [{ type: String }],
  traditionalPreparation: { type: String, default: '' },
  sunlight: { type: String, default: 'Medium' },
  watering: { type: String, default: 'Moderate' },
  soil: { type: String, default: '' },
  spaceRequired: { type: String, default: '' },
  indoorOutdoor: { type: String, default: 'Both' },
  maintenanceLevel: { type: String, default: 'Low' },
  vastuDirections: [{ type: String }],
  vastuExplanation: { type: String, default: '' },
  precautions: { type: String, default: '' },
  image: { type: String, default: '' },
  model3D: {
    type: { type: String, default: 'herb' },
    potColor: { type: String, default: '#c25e37' },
    foliageColor: { type: String, default: '#2d6a4f' },
    flowerColor: { type: String, default: '#ffffff' },
    heightScale: { type: Number, default: 1.0 },
    leafDensity: { type: Number, default: 1.0 }
  },
  spacingRequiredFt: { type: Number, default: 1.5 }
}, { timestamps: true, versionKey: false });

plantSchema.index({ name: 'text', scientificName: 'text', traditionalUses: 'text', description: 'text' });

export const Plant = mongoose.models.Plant || mongoose.model('Plant', plantSchema);
