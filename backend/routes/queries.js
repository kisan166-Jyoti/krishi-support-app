const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// POST /api/queries
router.post('/', verifyToken, (req, res) => {
  try {
    const { farmer_name, crop_id, question } = req.body;

    if (!farmer_name || !question) {
      return res.status(400).json({ error: 'farmer_name and question are required' });
    }

    const result = db.prepare(`
      INSERT INTO queries (farmer_name, crop_id, question)
      VALUES (?, ?, ?)
    `).run(farmer_name, crop_id || null, question);

    const query = db.prepare('SELECT * FROM queries WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(query);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit query' });
  }
});

// GET /api/queries (for admin/verification)
router.get('/', (req, res) => {
  try {
    const queries = db.prepare(`
      SELECT q.*, c.name as crop_name
      FROM queries q
      LEFT JOIN crops c ON q.crop_id = c.id
      ORDER BY q.submitted_at DESC
    `).all();
    res.json(queries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
});

module.exports = router;
