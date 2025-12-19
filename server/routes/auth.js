const express = require('express');
const { db } = require('../database');
const router = express.Router();

router.post('/register', (req, res) => {
  const { email, password } = req.body;
  db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, password], function(err) {
    if (err) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.json({ success: true, message: 'Registered successfully!' });
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ success: true, userId: user.id, user });
  });
});

module.exports = router;
