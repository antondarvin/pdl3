import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedPlants } from '../data/seedPlants.js';
import { seedQuizzes } from '../data/seedQuizzes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless ? '/tmp' : path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

let inMemoryDb = {
  users: [],
  plants: [],
  gardens: [],
  savedPlants: [],
  quizQuestions: [],
  quizResults: [],
  userActivities: []
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadStore() {
  ensureDataDir();
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryDb = JSON.parse(content);
    }
  } catch (err) {
    console.warn('Could not read existing store file, initializing fresh:', err.message);
  }

  // Ensure plants are initialized with rich seeds
  if (!inMemoryDb.plants || inMemoryDb.plants.length === 0) {
    inMemoryDb.plants = seedPlants.map((plant, index) => ({
      _id: `plant_${index + 1}`,
      ...plant,
      createdAt: new Date().toISOString()
    }));
  }

  // Ensure quiz questions are initialized
  if (!inMemoryDb.quizQuestions || inMemoryDb.quizQuestions.length === 0) {
    inMemoryDb.quizQuestions = seedQuizzes.map((q, index) => ({
      _id: `quiz_${index + 1}`,
      ...q
    }));
  }

  // Ensure collections exist
  inMemoryDb.users = inMemoryDb.users || [];
  inMemoryDb.gardens = inMemoryDb.gardens || [];
  inMemoryDb.savedPlants = inMemoryDb.savedPlants || [];
  inMemoryDb.quizResults = inMemoryDb.quizResults || [];
  inMemoryDb.userActivities = inMemoryDb.userActivities || [];

  saveStore();
  console.log(`🌿 Plant database initialized with ${inMemoryDb.plants.length} AYUSH medicinal plants.`);
}

export function saveStore() {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving store:', err.message);
  }
}

// User operations
export const UserStore = {
  findByEmail: (email) => {
    return inMemoryDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  findById: (id) => {
    return inMemoryDb.users.find((u) => u._id === id);
  },
  create: (userData) => {
    const newUser = {
      _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...userData,
      createdAt: new Date().toISOString()
    };
    inMemoryDb.users.push(newUser);
    saveStore();
    return newUser;
  },
  update: (id, updates) => {
    const userIndex = inMemoryDb.users.findIndex((u) => u._id === id);
    if (userIndex === -1) return null;
    inMemoryDb.users[userIndex] = { ...inMemoryDb.users[userIndex], ...updates, updatedAt: new Date().toISOString() };
    saveStore();
    return inMemoryDb.users[userIndex];
  },
  delete: (id) => {
    const initialLen = inMemoryDb.users.length;
    inMemoryDb.users = inMemoryDb.users.filter((u) => u._id !== id);
    // Cleanup related user data
    inMemoryDb.gardens = inMemoryDb.gardens.filter((g) => g.userId !== id);
    inMemoryDb.savedPlants = inMemoryDb.savedPlants.filter((sp) => sp.userId !== id);
    inMemoryDb.quizResults = inMemoryDb.quizResults.filter((qr) => qr.userId !== id);
    inMemoryDb.userActivities = inMemoryDb.userActivities.filter((ua) => ua.userId !== id);
    saveStore();
    return inMemoryDb.users.length < initialLen;
  }
};

// Plant operations
export const PlantStore = {
  getAll: (filters = {}) => {
    let list = [...inMemoryDb.plants];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.scientificName.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.traditionalUses.toLowerCase().includes(q)
      );
    }

    if (filters.ayushSystem && filters.ayushSystem !== 'All') {
      list = list.filter((p) => p.ayushSystem.toLowerCase() === filters.ayushSystem.toLowerCase());
    }

    if (filters.sunlight && filters.sunlight !== 'All') {
      list = list.filter((p) => p.sunlight.toLowerCase().includes(filters.sunlight.toLowerCase()));
    }

    if (filters.watering && filters.watering !== 'All') {
      list = list.filter((p) => p.watering.toLowerCase().includes(filters.watering.toLowerCase()));
    }

    if (filters.indoorOutdoor && filters.indoorOutdoor !== 'All') {
      list = list.filter((p) => 
        p.indoorOutdoor.toLowerCase().includes(filters.indoorOutdoor.toLowerCase()) || 
        p.indoorOutdoor.toLowerCase().includes('both')
      );
    }

    if (filters.maintenanceLevel && filters.maintenanceLevel !== 'All') {
      list = list.filter((p) => p.maintenanceLevel.toLowerCase() === filters.maintenanceLevel.toLowerCase());
    }

    if (filters.sort) {
      if (filters.sort === 'name-asc') {
        list.sort((a, b) => a.name.localeCompare(b.name));
      } else if (filters.sort === 'name-desc') {
        list.sort((a, b) => b.name.localeCompare(a.name));
      }
    }

    return list;
  },
  getById: (id) => {
    return inMemoryDb.plants.find((p) => p._id === id || p._id === `plant_${id}`);
  }
};

// Garden operations
export const GardenStore = {
  getByUser: (userId) => {
    return inMemoryDb.gardens.filter((g) => g.userId === userId);
  },
  getById: (id, userId) => {
    return inMemoryDb.gardens.find((g) => g._id === id && g.userId === userId);
  },
  create: (gardenData) => {
    const newGarden = {
      _id: `garden_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...gardenData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    inMemoryDb.gardens.push(newGarden);
    saveStore();
    return newGarden;
  },
  update: (id, userId, updates) => {
    const idx = inMemoryDb.gardens.findIndex((g) => g._id === id && g.userId === userId);
    if (idx === -1) return null;
    inMemoryDb.gardens[idx] = {
      ...inMemoryDb.gardens[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveStore();
    return inMemoryDb.gardens[idx];
  },
  delete: (id, userId) => {
    const initLen = inMemoryDb.gardens.length;
    inMemoryDb.gardens = inMemoryDb.gardens.filter((g) => !(g._id === id && g.userId === userId));
    saveStore();
    return inMemoryDb.gardens.length < initLen;
  }
};

// Saved plants operations
export const SavedPlantStore = {
  getByUser: (userId) => {
    const saved = inMemoryDb.savedPlants.filter((sp) => sp.userId === userId);
    return saved.map((s) => {
      const plant = inMemoryDb.plants.find((p) => p._id === s.plantId);
      return {
        _id: s._id,
        userId: s.userId,
        plantId: s.plantId,
        savedAt: s.savedAt,
        plant: plant || null
      };
    }).filter(item => item.plant !== null);
  },
  save: (userId, plantId) => {
    const existing = inMemoryDb.savedPlants.find((sp) => sp.userId === userId && sp.plantId === plantId);
    if (existing) return existing;
    const item = {
      _id: `sp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      plantId,
      savedAt: new Date().toISOString()
    };
    inMemoryDb.savedPlants.push(item);
    saveStore();
    return item;
  },
  remove: (userId, plantId) => {
    const initLen = inMemoryDb.savedPlants.length;
    inMemoryDb.savedPlants = inMemoryDb.savedPlants.filter(
      (sp) => !(sp.userId === userId && (sp.plantId === plantId || sp._id === plantId))
    );
    saveStore();
    return inMemoryDb.savedPlants.length < initLen;
  }
};

// Quiz operations
export const QuizStore = {
  getQuestions: () => {
    return inMemoryDb.quizQuestions;
  },
  saveResult: (resultData) => {
    const newResult = {
      _id: `qres_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...resultData,
      completedAt: new Date().toISOString()
    };
    inMemoryDb.quizResults.push(newResult);
    saveStore();
    return newResult;
  },
  getResultsByUser: (userId) => {
    return inMemoryDb.quizResults.filter((r) => r.userId === userId);
  }
};

// User activity tracking
export const ActivityStore = {
  log: (userId, type, details) => {
    const act = {
      _id: `act_${Date.now()}`,
      userId,
      type,
      details,
      timestamp: new Date().toISOString()
    };
    inMemoryDb.userActivities.unshift(act);
    // Keep last 100 activities per store
    if (inMemoryDb.userActivities.length > 200) {
      inMemoryDb.userActivities = inMemoryDb.userActivities.slice(0, 200);
    }
    saveStore();
    return act;
  },
  getByUser: (userId, limit = 10) => {
    return inMemoryDb.userActivities.filter((a) => a.userId === userId).slice(0, limit);
  }
};
