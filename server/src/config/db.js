import mongoose from 'mongoose';
import { loadStore, getJsonSnapshot } from '../store/jsonStore.js';
import { seedPlants } from '../data/seedPlants.js';
import { seedQuizzes } from '../data/seedQuizzes.js';
import { User } from '../models/User.js';
import { Plant } from '../models/Plant.js';
import { Garden } from '../models/Garden.js';
import { SavedPlant } from '../models/SavedPlant.js';
import { QuizQuestion, QuizResult, UserActivity } from '../models/QuizAndActivity.js';

mongoose.set('strictQuery', true);

// One cached promise so serverless (Vercel) invocations and local runs connect only once.
let connectPromise = null;
let engine = 'json';

export const isMongo = () => engine === 'mongo' && mongoose.connection.readyState === 1;
export const getEngine = () => (isMongo() ? 'mongodb' : 'json-fallback');

async function seedIfEmpty() {
  if ((await Plant.estimatedDocumentCount()) === 0) {
    await Plant.insertMany(
      seedPlants.map((p, i) => ({ _id: `plant_${i + 1}`, ...p })),
      { ordered: false }
    );
    console.log(`🌱 Seeded ${seedPlants.length} plants into MongoDB`);
  }
  if ((await QuizQuestion.estimatedDocumentCount()) === 0) {
    await QuizQuestion.insertMany(
      seedQuizzes.map((q, i) => ({ _id: `quiz_${i + 1}`, ...q })),
      { ordered: false }
    );
    console.log(`🧠 Seeded ${seedQuizzes.length} quiz questions into MongoDB`);
  }
}

// One-time import of data saved earlier in data/store.json (only into empty collections).
async function migrateJsonStore() {
  const snap = getJsonSnapshot();
  const jobs = [
    [User, snap.users],
    [Garden, snap.gardens],
    [SavedPlant, snap.savedPlants],
    [QuizResult, snap.quizResults],
    [UserActivity, snap.userActivities]
  ];
  for (const [Model, docs] of jobs) {
    if (!docs?.length) continue;
    if ((await Model.estimatedDocumentCount()) > 0) continue;
    try {
      await Model.insertMany(docs, { ordered: false });
      console.log(`📦 Migrated ${docs.length} ${Model.modelName} records from store.json → MongoDB`);
    } catch (err) {
      console.warn(`⚠️  Partial migration for ${Model.modelName}: ${err.message}`);
    }
  }
}

export function connectDB() {
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    loadStore(); // JSON store is always loaded: used as fallback + migration source

    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ayush_garden';
    if (process.env.MONGODB_URI === 'none') {
      console.log('ℹ️  MONGODB_URI=none → using local JSON store (server/data/store.json).');
      return getEngine();
    }

    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS || (process.env.MONGODB_URI ? 8000 : 2000)),
        maxPoolSize: 10
      });
      engine = 'mongo';
      console.log(`🍃 MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
      await seedIfEmpty();
      await migrateJsonStore();
    } catch (error) {
      engine = 'json';
      console.error(`❌ MongoDB connection failed: ${error.message}`);
      if (process.env.REQUIRE_MONGO === 'true') throw error;
      console.log('⚡ Falling back to local JSON store. Set REQUIRE_MONGO=true to fail instead.');
    }
    return getEngine();
  })();

  return connectPromise;
}

mongoose.connection.on('disconnected', () => {
  if (engine === 'mongo') console.warn('⚠️  MongoDB disconnected — mongoose will retry automatically.');
});
mongoose.connection.on('reconnected', () => console.log('🍃 MongoDB reconnected'));
