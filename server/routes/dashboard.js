const express = require('express');
const { db } = require('../database');
const router = express.Router();

router.get('/data/:userId', async (req, res) => {
  const { userId } = req.params;
  
  // Get all data in parallel
  db.all('SELECT date, gadscore, phqscore FROM questionnaire WHERE userid = ?', [userId], (err, questionnaire) => {
    db.all('SELECT date, moodscore FROM mood WHERE userid = ?', [userId], (err, mood) => {
      db.all('SELECT date, sentiment FROM journal WH  ERE userid = ?', [userId], (err, journal) => {
        db.all('SELECT date, sentiment FROM chat WHERE userid = ?', [userId], (err, chat) => {
          res.json({
            questionnaire,
            mood,     
            journal,
            chat
          });
        });
      });
    });
  });
});

module.exports = router;
