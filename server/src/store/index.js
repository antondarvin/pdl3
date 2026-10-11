/**
 * Unified data-access layer.
 * Every method is async and transparently uses MongoDB (via Mongoose) when connected,
 * or the local JSON store (jsonStore.js) when MongoDB is unavailable.
 * Routes never need to know which engine is active.
 */
import { isMongo } from '../config/db.js';
import * as J from './jsonStore.js';
import { User } from '../models/User.js';
import { Plant } from '../models/Plant.js';
import { Garden } from '../models/Garden.js';
import { SavedPlant } from '../models/SavedPlant.js';
import { QuizQuestion, QuizResult, UserActivity } from '../models/QuizAndActivity.js';

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ci = (s) => new RegExp(escapeRegex(s), 'i');
const exactCi = (s) => new RegExp(`^${escapeRegex(s)}$`, 'i');

// ---------- Users ----------
export const UserStore = {
  async findByEmail(email) {
    if (!email) return null;
    if (!isMongo()) return J.UserStore.findByEmail(email);
    return User.findOne({ email: email.trim().toLowerCase() }).lean();
  },
  async findById(id) {
    if (!isMongo()) return J.UserStore.findById(id);
    return User.findById(id).lean();
  },
  async create(data) {
    if (!isMongo()) return J.UserStore.create(data);
    return (await User.create(data)).toObject();
  },
  async update(id, updates) {
    if (!isMongo()) return J.UserStore.update(id, updates);
    return User.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).lean();
  },
  async delete(id) {
    if (!isMongo()) return J.UserStore.delete(id);
    const res = await User.deleteOne({ _id: id });
    await Promise.all([
      Garden.deleteMany({ userId: id }),
      SavedPlant.deleteMany({ userId: id }),
      QuizResult.deleteMany({ userId: id }),
      UserActivity.deleteMany({ userId: id })
    ]);
    return res.deletedCount > 0;
  }
};

// ---------- Plants ----------
export const PlantStore = {
  async getAll(filters = {}) {
    if (!isMongo()) return J.PlantStore.getAll(filters);

    const q = {};
    if (filters.search) {
      const rx = ci(filters.search);
      q.$or = [{ name: rx }, { scientificName: rx }, { description: rx }, { traditionalUses: rx }];
    }
    if (filters.ayushSystem && filters.ayushSystem !== 'All') q.ayushSystem = exactCi(filters.ayushSystem);
    if (filters.sunlight && filters.sunlight !== 'All') q.sunlight = ci(filters.sunlight);
    if (filters.watering && filters.watering !== 'All') q.watering = ci(filters.watering);
    if (filters.indoorOutdoor && filters.indoorOutdoor !== 'All') {
      q.indoorOutdoor = { $in: [ci(filters.indoorOutdoor), /both/i] };
    }
    if (filters.maintenanceLevel && filters.maintenanceLevel !== 'All') {
      q.maintenanceLevel = exactCi(filters.maintenanceLevel);
    }

    let cursor = Plant.find(q);
    if (filters.sort === 'name-asc') cursor = cursor.sort({ name: 1 });
    else if (filters.sort === 'name-desc') cursor = cursor.sort({ name: -1 });
    else cursor = cursor.sort({ createdAt: 1, _id: 1 });
    return cursor.lean();
  },
  async getById(id) {
    if (!isMongo()) return J.PlantStore.getById(id);
    return Plant.findOne({ _id: { $in: [id, `plant_${id}`] } }).lean();
  }
};

// ---------- Gardens ----------
export const GardenStore = {
  async getByUser(userId) {
    if (!isMongo()) return J.GardenStore.getByUser(userId);
    return Garden.find({ userId }).sort({ updatedAt: -1 }).lean();
  },
  async getById(id, userId) {
    if (!isMongo()) return J.GardenStore.getById(id, userId);
    return Garden.findOne({ _id: id, userId }).lean();
  },
  async create(data) {
    if (!isMongo()) return J.GardenStore.create(data);
    return (await Garden.create(data)).toObject();
  },
  async update(id, userId, updates) {
    if (!isMongo()) return J.GardenStore.update(id, userId, updates);
    return Garden.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true, runValidators: true }).lean();
  },
  async delete(id, userId) {
    if (!isMongo()) return J.GardenStore.delete(id, userId);
    const res = await Garden.deleteOne({ _id: id, userId });
    return res.deletedCount > 0;
  },
  async countByUser(userId) {
    if (!isMongo()) return J.GardenStore.getByUser(userId).length;
    return Garden.countDocuments({ userId });
  }
};

// ---------- Saved plants ----------
export const SavedPlantStore = {
  async getByUser(userId) {
    if (!isMongo()) return J.SavedPlantStore.getByUser(userId);
    const saved = await SavedPlant.find({ userId }).sort({ savedAt: -1 }).lean();
    if (!saved.length) return [];
    const plants = await Plant.find({ _id: { $in: saved.map((s) => s.plantId) } }).lean();
    const byId = new Map(plants.map((p) => [p._id, p]));
    return saved
      .map((s) => ({ _id: s._id, userId: s.userId, plantId: s.plantId, savedAt: s.savedAt, plant: byId.get(s.plantId) || null }))
      .filter((s) => s.plant);
  },
  async save(userId, plantId) {
    if (!isMongo()) return J.SavedPlantStore.save(userId, plantId);
    return SavedPlant.findOneAndUpdate(
      { userId, plantId },
      { $setOnInsert: { userId, plantId, savedAt: new Date() } },
      { upsert: true, new: true }
    ).lean();
  },
  async remove(userId, plantIdOrId) {
    if (!isMongo()) return J.SavedPlantStore.remove(userId, plantIdOrId);
    const res = await SavedPlant.deleteMany({ userId, $or: [{ plantId: plantIdOrId }, { _id: plantIdOrId }] });
    return res.deletedCount > 0;
  },
  async countByUser(userId) {
    if (!isMongo()) return J.SavedPlantStore.getByUser(userId).length;
    return SavedPlant.countDocuments({ userId });
  }
};

// ---------- Quiz ----------
export const QuizStore = {
  async getQuestions() {
    if (!isMongo()) return J.QuizStore.getQuestions();
    return QuizQuestion.find().sort({ _id: 1 }).lean();
  },
  async saveResult(data) {
    if (!isMongo()) return J.QuizStore.saveResult(data);
    return (await QuizResult.create(data)).toObject();
  },
  async getResultsByUser(userId) {
    if (!isMongo()) return J.QuizStore.getResultsByUser(userId);
    return QuizResult.find({ userId }).sort({ completedAt: -1 }).lean();
  }
};

// ---------- Activity ----------
export const ActivityStore = {
  // Fire-and-forget safe: logging never breaks the main request.
  async log(userId, type, details) {
    try {
      if (!isMongo()) return J.ActivityStore.log(userId, type, details);
      return (await UserActivity.create({ userId, type, details })).toObject();
    } catch (err) {
      console.warn('Activity log failed:', err.message);
      return null;
    }
  },
  async getByUser(userId, limit = 10) {
    if (!isMongo()) return J.ActivityStore.getByUser(userId, limit);
    return UserActivity.find({ userId }).sort({ timestamp: -1 }).limit(limit).lean();
  }
};
