    const express = require('express');
const { db } = require('../database');
const router = express.Router();

router.post('/save', (req, res) => {
  const { userId, date, moodscore } = req.body;
  db.run('INSERT INTO mood (userid, date, moodscore) VALUES (?, ?, ?)',
    [userId, date, moodscore], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  db.all('SELECT date, moodscore FROM mood WHERE userid = ?', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
