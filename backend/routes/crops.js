const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/crops
router.get('/', (req, res) => {
  try {
    const crops = db.prepare('SELECT * FROM crops ORDER BY name').all();
    res.json(crops);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

// GET /api/crops/:id
router.get('/:id', (req, res) => {
  try {
    const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(req.params.id);
    if (!crop) return res.status(404).json({ error: 'Crop not found' });
    res.json(crop);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch crop' });
  }
});

module.exports = router;
