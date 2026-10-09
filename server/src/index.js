import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import { UserStore } from './store/index.js';

import authRoutes from './routes/auth.js';
import plantsRoutes from './routes/plants.js';
import gardensRoutes from './routes/gardens.js';
import userRoutes from './routes/user.js';
import quizRoutes from './routes/quiz.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialize Database & Store
await connectDB();

// Ensure a default demo user exists for immediate evaluation
async function initDemoUser() {
  const demoEmail = 'demo@ayushgarden.org';
  if (!UserStore.findByEmail(demoEmail)) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('garden123', salt);
    UserStore.create({
      name: 'Aarav Sharma',
      email: demoEmail,
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      termsAccepted: true
    });
    console.log('🌱 Demo account initialized: demo@ayushgarden.org / garden123');
  }
}
await initDemoUser();

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/plants', plantsRoutes);
app.use('/api/gardens', gardensRoutes);
app.use('/api/user', userRoutes);
app.use('/api/quiz', quizRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Virtual Herbal Garden AYUSH & Vastu Planner API'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

export default app;

const isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('server/src/index.js');

if (isDirectRun && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🌿 Virtual Herbal Garden Server running on port ${PORT}`);
  });
}
