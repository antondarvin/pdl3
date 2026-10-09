import mongoose from 'mongoose';

const placedPlantSchema = new mongoose.Schema({
  plantId: { type: String, required: true },
  name: { type: String, required: true },
  scientificName: { type: String },
  image: { type: String },
  x: { type: Number, required: true }, // position in percentage or ft
  y: { type: Number, required: true },
  rotation: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  model3D: { type: Object },
  potSizeFt: { type: Number, default: 1.0 },
  spacingRequiredFt: { type: Number, default: 1.5 },
  plantHeightFt: { type: Number }
});

const gardenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gardenName: { type: String, required: true },
  roomType: { type: String, default: 'Balcony' },
  length: { type: Number, required: true },
  width: { type: Number, required: true },
  direction: { type: String, default: 'North-East' },
  plants: [placedPlantSchema],
  notes: { type: String, default: '' },
  unit: { type: String, default: 'ft' },
  totalSquareFeet: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Garden = mongoose.model('Garden', gardenSchema);
