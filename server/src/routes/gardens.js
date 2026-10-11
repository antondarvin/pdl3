import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { GardenStore, ActivityStore } from '../store/index.js';

const router = express.Router();

const clamp = (n, lo, hi, d) => (Number.isFinite(Number(n)) ? Math.min(hi, Math.max(lo, Number(n))) : d);

// Normalise placed plants so both MongoDB validation and the JSON store get clean data.
function sanitizePlants(plants) {
  if (!Array.isArray(plants)) return [];
  return plants
    .filter((p) => p && p.plantId && p.name)
    .slice(0, 200)
    .map((p, i) => ({
      id: String(p.id || `placed_${Date.now()}_${i}`),
      plantId: String(p.plantId),
      name: String(p.name),
      scientificName: p.scientificName || '',
      image: p.image || '',
      x: clamp(p.x, 0, 100, 50),
      y: clamp(p.y, 0, 100, 50),
      rotation: clamp(p.rotation, -360, 720, 0),
      scale: clamp(p.scale, 0.1, 5, 1),
      model3D: p.model3D,
      potSizeFt: clamp(p.potSizeFt, 0.1, 10, 1),
      spacingRequiredFt: clamp(p.spacingRequiredFt, 0, 20, 1.5),
      ...(p.plantHeightFt !== undefined && { plantHeightFt: clamp(p.plantHeightFt, 0, 50, 2) }),
      ...(Number.isFinite(p.worldX) && { worldX: p.worldX }),
      ...(Number.isFinite(p.worldZ) && { worldZ: p.worldZ }),
      ...(['planner', 'ar-webxr', 'ar-camera', '3d'].includes(p.placedVia) && { placedVia: p.placedVia })
    }));
}

// Apply auth to all garden routes
router.use(authenticate);

// GET /api/gardens - get current user's gardens
router.get('/', async (req, res) => {
  try {
    const gardens = await GardenStore.getByUser(req.user._id);
    res.json(gardens);
  } catch (error) {
    console.error('Error fetching gardens:', error);
    res.status(500).json({ message: 'Failed to retrieve garden plans.' });
  }
});

// POST /api/gardens - create new garden
router.post('/', async (req, res) => {
  try {
    const { gardenName, roomType, length, width, direction, plants, notes, unit, totalSquareFeet } = req.body;

    if (!gardenName || !Number.isFinite(Number(length)) || !Number.isFinite(Number(width))) {
      return res.status(400).json({ message: 'Garden name, length, and width are required.' });
    }

    const gardenUnit = unit === 'm' ? 'm' : 'ft';
    const numLength = Number(length);
    const numWidth = Number(width);
    const calcTotalSqFt = totalSquareFeet !== undefined
      ? Number(totalSquareFeet)
      : (gardenUnit === 'm' ? Math.round(numLength * numWidth * 10.7639 * 10) / 10 : Math.round(numLength * numWidth * 10) / 10);

    const newGarden = await GardenStore.create({
      userId: req.user._id,
      gardenName: gardenName.trim(),
      roomType: roomType || 'Balcony',
      length: numLength,
      width: numWidth,
      direction: direction || 'North-East',
      plants: sanitizePlants(plants),
      notes: notes || '',
      unit: gardenUnit,
      totalSquareFeet: calcTotalSqFt
    });

    await ActivityStore.log(
      req.user._id,
      'PLAN_GARDEN',
      `Designed garden layout "${newGarden.gardenName}" with ${newGarden.plants.length} plants`
    );

    res.status(201).json({
      message: 'Garden plan saved successfully!',
      garden: newGarden
    });
  } catch (error) {
    console.error('Error creating garden:', error);
    res.status(500).json({ message: 'Failed to save garden plan.' });
  }
});

// GET /api/gardens/:id
router.get('/:id', async (req, res) => {
  try {
    const garden = await GardenStore.getById(req.params.id, req.user._id);
    if (!garden) {
      return res.status(404).json({ message: 'Garden design not found.' });
    }
    res.json(garden);
  } catch (error) {
    console.error('Error getting garden:', error);
    res.status(500).json({ message: 'Failed to fetch garden plan.' });
  }
});

// PUT /api/gardens/:id
router.put('/:id', async (req, res) => {
  try {
    const { gardenName, roomType, length, width, direction, plants, notes, unit, totalSquareFeet } = req.body;

    const numLength = length !== undefined ? Number(length) : undefined;
    const numWidth = width !== undefined ? Number(width) : undefined;
    const gardenUnit = unit !== undefined ? (unit === 'm' ? 'm' : 'ft') : undefined;

    let calcTotalSqFt = totalSquareFeet !== undefined ? Number(totalSquareFeet) : undefined;
    if (calcTotalSqFt === undefined && numLength !== undefined && numWidth !== undefined) {
      calcTotalSqFt = (gardenUnit === 'm' ? Math.round(numLength * numWidth * 10.7639 * 10) / 10 : Math.round(numLength * numWidth * 10) / 10);
    }

    const updated = await GardenStore.update(req.params.id, req.user._id, {
      ...(gardenName && { gardenName: gardenName.trim() }),
      ...(roomType && { roomType }),
      ...(numLength !== undefined && { length: numLength }),
      ...(numWidth !== undefined && { width: numWidth }),
      ...(direction && { direction }),
      ...(plants !== undefined && { plants: sanitizePlants(plants) }),
      ...(notes !== undefined && { notes }),
      ...(gardenUnit && { unit: gardenUnit }),
      ...(calcTotalSqFt !== undefined && { totalSquareFeet: calcTotalSqFt })
    });

    if (!updated) {
      return res.status(404).json({ message: 'Garden not found or unauthorized.' });
    }

    await ActivityStore.log(
      req.user._id,
      'UPDATE_GARDEN',
      `Updated layout "${updated.gardenName}"`
    );

    res.json({
      message: 'Garden design updated successfully!',
      garden: updated
    });
  } catch (error) {
    console.error('Error updating garden:', error);
    res.status(500).json({ message: 'Failed to update garden design.' });
  }
});

// DELETE /api/gardens/:id
router.delete('/:id', async (req, res) => {
  try {
    const success = await GardenStore.delete(req.params.id, req.user._id);
    if (!success) {
      return res.status(404).json({ message: 'Garden not found or already deleted.' });
    }

    await ActivityStore.log(req.user._id, 'DELETE_GARDEN', `Removed a garden layout`);

    res.json({ message: 'Garden design removed successfully.' });
  } catch (error) {
    console.error('Error deleting garden:', error);
    res.status(500).json({ message: 'Failed to delete garden design.' });
  }
});

export default router;
