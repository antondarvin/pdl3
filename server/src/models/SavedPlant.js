import mongoose from 'mongoose';
import { stringId } from './_id.js';

const savedPlantSchema = new mongoose.Schema({
  _id: stringId('sp'),
  userId: { type: String, ref: 'User', required: true, index: true },
  plantId: { type: String, ref: 'Plant', required: true },
  savedAt: { type: Date, default: Date.now }
}, { versionKey: false });

savedPlantSchema.index({ userId: 1, plantId: 1 }, { unique: true });

export const SavedPlant = mongoose.models.SavedPlant || mongoose.model('SavedPlant', savedPlantSchema);
