const express = require('express');
const { db } = require('../database');
const router = express.Router();

router.post('/save', (req, res) => {
  const { userId, gadscore, phqscore, date } = req.body;
  db.run('INSERT INTO questionnaire (userid, gadscore, phqscore, date) VALUES (?, ?, ?, ?)',
    [userId, gadscore, phqscore, date], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  db.all('SELECT date, gadscore, phqscore FROM questionnaire WHERE userid = ?', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
// INSERT_YOUR_CODE

/**
 * Middleware and endpoint to enforce the questionnaire only shows once per user, after sign in.
 * 
 * Approach:
 * - On sign in, check if the user has at least one questionnaire.
 * - If not, flag to the frontend that questionnaire needs to be shown.
 * - Do not expose a direct questionnaire page/tab route.
 * - You can use GET /questionnaire/completed/:userId to check from the frontend.
 */

// Check if questionnaire was completed by user (returns { completed: true/false })
router.get('/completed/:userId', (req, res) => {
  const { userId } = req.params;
  db.get(
    'SELECT 1 FROM questionnaire WHERE userid = ? LIMIT 1',
    [userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      // completed: true if user has submitted at least one questionnaire
      res.json({ completed: !!row });
    }
  );
});

