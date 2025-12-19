const express = require('express');
const { db } = require('../database');
const router = express.Router();

router.post('/save', (req, res) => {
  const { userId, entry, sentiment, date } = req.body;
  db.run('INSERT INTO journal (userid, entry, sentiment, date) VALUES (?, ?, ?, ?)',
    [userId, entry, sentiment, date], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: 'Journal saved!' });
    });
});

module.exports = router;
