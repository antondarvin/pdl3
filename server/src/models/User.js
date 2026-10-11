import mongoose from 'mongoose';
import { stringId } from './_id.js';

const userSchema = new mongoose.Schema({
  _id: stringId('user'),
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  termsAccepted: { type: Boolean, default: true },
  notificationPreferences: {
    wateringReminders: { type: Boolean, default: true },
    seasonalTips: { type: Boolean, default: true },
    quizChallenges: { type: Boolean, default: false }
  }
}, { timestamps: true, versionKey: false });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
