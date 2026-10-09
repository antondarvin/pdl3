import express from 'express';
import { PlantStore } from '../store/index.js';

const router = express.Router();

// GET /api/plants
router.get('/', (req, res) => {
  try {
    const { search, ayushSystem, sunlight, watering, indoorOutdoor, maintenanceLevel, sort } = req.query;

    const plants = PlantStore.getAll({
      search,
      ayushSystem,
      sunlight,
      watering,
      indoorOutdoor,
      maintenanceLevel,
      sort
    });

    res.json({
      count: plants.length,
      plants
    });
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.status(500).json({ message: 'Failed to retrieve plant database.' });
  }
});

// GET /api/plants/:id
router.get('/:id', (req, res) => {
  try {
    const plant = PlantStore.getById(req.params.id);
    if (!plant) {
      return res.status(404).json({ message: 'Medicinal plant not found.' });
    }
    res.json(plant);
  } catch (error) {
    console.error('Error fetching plant by ID:', error);
    res.status(500).json({ message: 'Failed to fetch plant details.' });
  }
});

export default router;
