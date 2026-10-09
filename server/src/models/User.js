import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  notificationPreferences: {
    wateringReminders: { type: Boolean, default: true },
    seasonalTips: { type: Boolean, default: true },
    quizChallenges: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
