import mongoose from 'mongoose';

const savedPlantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  savedAt: { type: Date, default: Date.now }
});

export const SavedPlant = mongoose.model('SavedPlant', savedPlantSchema);
