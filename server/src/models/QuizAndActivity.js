import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['multiple-choice', 'plant-identification', 'true-false'] 
  },
  image: { type: String, default: '' },
  options: [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true },
  explanation: { type: String, required: true },
  ayushCategory: { type: String, default: 'Ayurveda' }
});

export const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);

const quizResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  category: { type: String, default: 'General' },
  answers: [{
    questionIndex: Number,
    selectedOption: Number,
    isCorrect: Boolean
  }],
  completedAt: { type: Date, default: Date.now }
});

export const QuizResult = mongoose.model('QuizResult', quizResultSchema);

const userActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // 'EXPLORE_PLANT', 'SAVE_PLANT', 'PLAN_GARDEN', 'TAKE_QUIZ'
  details: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const UserActivity = mongoose.model('UserActivity', userActivitySchema);
