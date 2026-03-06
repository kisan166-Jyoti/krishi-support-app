const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/advisories?cropId=&type=
router.get('/', (req, res) => {
  try {
    const { cropId, type } = req.query;
    let query = `
      SELECT a.*, c.name as crop_name, c.icon as crop_icon
      FROM advisories a
      JOIN crops c ON a.crop_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (cropId) {
      query += ' AND a.crop_id = ?';
      params.push(cropId);
    }
    if (type) {
      query += ' AND a.type = ?';
      params.push(type);
    }

    query += ' ORDER BY a.severity DESC, a.title ASC';

    const advisories = db.prepare(query).all(...params);
    res.json(advisories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch advisories' });
  }
});

// GET /api/advisories/:id
router.get('/:id', (req, res) => {
  try {
    const advisory = db.prepare(`
      SELECT a.*, c.name as crop_name, c.icon as crop_icon
      FROM advisories a
      JOIN crops c ON a.crop_id = c.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!advisory) return res.status(404).json({ error: 'Advisory not found' });
    res.json(advisory);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch advisory' });
  }
});

module.exports = router;
