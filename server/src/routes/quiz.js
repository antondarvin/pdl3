import express from 'express';
import { QuizStore, ActivityStore } from '../store/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/quiz - fetch quiz questions
router.get('/', async (req, res) => {
  try {
    const questions = await QuizStore.getQuestions();
    res.json({
      count: questions.length,
      questions
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Failed to retrieve quiz questions.' });
  }
});

// POST /api/quiz/results - save quiz score
router.post('/results', authenticate, async (req, res) => {
  try {
    const { score, totalQuestions, answers, category } = req.body;

    if (score === undefined || !totalQuestions) {
      return res.status(400).json({ message: 'Score and totalQuestions are required.' });
    }

    const savedResult = await QuizStore.saveResult({
      userId: req.user._id,
      score: Number(score),
      totalQuestions: Number(totalQuestions),
      category: category || 'Herbal Garden & Vastu Knowledge',
      answers: answers || []
    });

    const percentage = Math.round((Number(score) / Number(totalQuestions)) * 100);
    await ActivityStore.log(
      req.user._id,
      'TAKE_QUIZ',
      `Completed AYUSH Quiz: Scored ${score}/${totalQuestions} (${percentage}%)`
    );

    res.status(201).json({
      message: 'Quiz result recorded successfully!',
      result: savedResult
    });
  } catch (error) {
    console.error('Error recording quiz result:', error);
    res.status(500).json({ message: 'Failed to record quiz results.' });
  }
});

export default router;
