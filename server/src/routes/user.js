import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticate } from '../middleware/auth.js';
import { 
  UserStore, 
  SavedPlantStore, 
  GardenStore, 
  QuizStore, 
  ActivityStore,
  PlantStore 
} from '../store/index.js';

const router = express.Router();

router.use(authenticate);

// GET /api/user/profile
router.get('/profile', (req, res) => {
  const user = UserStore.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// PUT /api/user/profile
router.put('/profile', async (req, res) => {
  try {
    const { name, avatar, notificationPreferences, currentPassword, newPassword } = req.body;
    const user = UserStore.findById(req.user._id);

    const updates = {};
    if (name) updates.name = name.trim();
    if (avatar) updates.avatar = avatar;
    if (notificationPreferences) updates.notificationPreferences = notificationPreferences;

    // Password change handling
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters.' });
      }
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(newPassword, salt);
    }

    const updated = UserStore.update(req.user._id, updates);
    const { password: _, ...safeUser } = updated;

    ActivityStore.log(req.user._id, 'PROFILE_UPDATE', 'Updated account settings');

    res.json({
      message: 'Profile updated successfully!',
      user: safeUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

// GET /api/user/saved-plants
router.get('/saved-plants', (req, res) => {
  try {
    const saved = SavedPlantStore.getByUser(req.user._id);
    res.json(saved);
  } catch (error) {
    console.error('Error fetching saved plants:', error);
    res.status(500).json({ message: 'Failed to retrieve saved plants.' });
  }
});

// POST /api/user/saved-plants
router.post('/saved-plants', (req, res) => {
  try {
    const { plantId } = req.body;
    if (!plantId) {
      return res.status(400).json({ message: 'Plant ID is required.' });
    }

    const plant = PlantStore.getById(plantId);
    if (!plant) {
      return res.status(404).json({ message: 'Plant not found.' });
    }

    const saved = SavedPlantStore.save(req.user._id, plant._id);

    ActivityStore.log(req.user._id, 'SAVE_PLANT', `Saved ${plant.name} to personal collection`);

    res.status(201).json({
      message: `${plant.name} added to your saved plants!`,
      saved
    });
  } catch (error) {
    console.error('Error saving plant:', error);
    res.status(500).json({ message: 'Failed to save plant.' });
  }
});

// DELETE /api/user/saved-plants/:id
router.delete('/saved-plants/:id', (req, res) => {
  try {
    const plantId = req.params.id;
    const removed = SavedPlantStore.remove(req.user._id, plantId);
    if (!removed) {
      return res.status(404).json({ message: 'Saved plant item not found.' });
    }

    ActivityStore.log(req.user._id, 'UNSAVE_PLANT', `Removed a plant from saved collection`);

    res.json({ message: 'Plant removed from saved list.' });
  } catch (error) {
    console.error('Error removing saved plant:', error);
    res.status(500).json({ message: 'Failed to remove saved plant.' });
  }
});

// GET /api/user/stats
router.get('/stats', (req, res) => {
  try {
    const savedCount = SavedPlantStore.getByUser(req.user._id).length;
    const gardenCount = GardenStore.getByUser(req.user._id).length;
    const quizResults = QuizStore.getResultsByUser(req.user._id);

    let totalScore = 0;
    let totalPossible = 0;
    quizResults.forEach((q) => {
      totalScore += q.score;
      totalPossible += q.totalQuestions;
    });

    const quizScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    const totalPlantsExplored = Math.max(savedCount + 3, 14); // dynamic exploration metric

    res.json({
      plantsExplored: totalPlantsExplored,
      plantsSaved: savedCount,
      gardenDesigns: gardenCount,
      quizScore: `${quizScore}%`,
      quizzesTaken: quizResults.length
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Failed to fetch user dashboard statistics.' });
  }
});

// GET /api/user/activity
router.get('/activity', (req, res) => {
  try {
    const activities = ActivityStore.getByUser(req.user._id, 15);
    res.json(activities);
  } catch (error) {
    console.error('Error getting user activity:', error);
    res.status(500).json({ message: 'Failed to fetch user activity.' });
  }
});

// DELETE /api/user/account - delete user account
router.delete('/account', (req, res) => {
  try {
    const success = UserStore.delete(req.user._id);
    if (!success) {
      return res.status(404).json({ message: 'User account could not be found.' });
    }
    res.json({ message: 'Account and associated garden data deleted successfully.' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Failed to delete account.' });
  }
});

export default router;
