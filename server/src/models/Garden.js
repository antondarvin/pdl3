import mongoose from 'mongoose';
import { stringId } from './_id.js';

// A plant placed in a garden layout. x / y are 0–100 % of the garden width / length
// (same convention as the 2D planner). worldX / worldZ keep the exact AR position in metres.
const placedPlantSchema = new mongoose.Schema({
  id: { type: String, required: true },
  plantId: { type: String, required: true },
  name: { type: String, required: true },
  scientificName: { type: String, default: '' },
  image: { type: String, default: '' },
  x: { type: Number, required: true, min: 0, max: 100 },
  y: { type: Number, required: true, min: 0, max: 100 },
  rotation: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  model3D: { type: Object },
  potSizeFt: { type: Number, default: 1.0 },
  spacingRequiredFt: { type: Number, default: 1.5 },
  plantHeightFt: { type: Number },
  worldX: { type: Number },
  worldZ: { type: Number },
  placedVia: { type: String, enum: ['planner', 'ar-webxr', 'ar-camera', '3d'], default: 'planner' }
}, { _id: false, id: false });

const gardenSchema = new mongoose.Schema({
  _id: stringId('garden'),
  userId: { type: String, ref: 'User', required: true, index: true },
  gardenName: { type: String, required: true, trim: true },
  roomType: { type: String, default: 'Balcony' },
  length: { type: Number, required: true, min: 0 },
  width: { type: Number, required: true, min: 0 },
  direction: { type: String, default: 'North-East' },
  plants: [placedPlantSchema],
  notes: { type: String, default: '' },
  unit: { type: String, enum: ['ft', 'm'], default: 'ft' },
  totalSquareFeet: { type: Number }
}, { timestamps: true, versionKey: false });

export const Garden = mongoose.models.Garden || mongoose.model('Garden', gardenSchema);
