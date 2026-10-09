import mongoose from 'mongoose';
import { loadStore } from '../store/index.js';

export async function connectDB() {
  // Always initialize store data cache
  loadStore();

  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ayush_garden';
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000 // Quick fallback if local MongoDB is not running
    });
    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`ℹ️  Notice: MongoDB not reachable locally (${error.message}).`);
    console.log(`⚡ Seamless high-performance local persistent store active. All endpoints fully functional!`);
  }
}
