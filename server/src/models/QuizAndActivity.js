import mongoose from 'mongoose';
import { stringId } from './_id.js';

const quizQuestionSchema = new mongoose.Schema({
  _id: stringId('quiz'),
  question: { type: String, required: true },
  type: { type: String, required: true, enum: ['multiple-choice', 'plant-identification', 'true-false'] },
  image: { type: String, default: '' },
  options: [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true },
  explanation: { type: String, required: true },
  ayushCategory: { type: String, default: 'Ayurveda' }
}, { versionKey: false });

export const QuizQuestion = mongoose.models.QuizQuestion || mongoose.model('QuizQuestion', quizQuestionSchema);

const quizResultSchema = new mongoose.Schema({
  _id: stringId('qres'),
  userId: { type: String, ref: 'User', required: true, index: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  category: { type: String, default: 'General' },
  answers: [{ _id: false, questionIndex: Number, selectedOption: Number, isCorrect: Boolean }],
  completedAt: { type: Date, default: Date.now }
}, { versionKey: false });

export const QuizResult = mongoose.models.QuizResult || mongoose.model('QuizResult', quizResultSchema);

const userActivitySchema = new mongoose.Schema({
  _id: stringId('act'),
  userId: { type: String, ref: 'User', required: true, index: true },
  type: { type: String, required: true },
  details: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true }
}, { versionKey: false });

export const UserActivity = mongoose.models.UserActivity || mongoose.model('UserActivity', userActivitySchema);
