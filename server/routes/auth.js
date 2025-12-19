// server/routes/auth.js
const express = require('express');
const { db } = require('../database');
const router = express.Router();

/**
 * Register (general user or doctor)
 * For general user: POST /api/auth/register { email, password }
 * For doctor: POST /api/auth/register { email, password, role: 'doctor', name: 'Dr Name', organization: 'Org' }
 */
router.post('/register', (req, res) => {
  const {
    email,
    password,
    role = 'user',
    name = null,
    organization = null
  } = req.body;

  // ✅ Input validation
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email and password required' 
    });
  }

  db.run(
    'INSERT INTO users (email, password, role, name, organization) VALUES (?, ?, ?, ?, ?)',
    [email, password, role, name, organization],
    function (err) {
      if (err) {
        console.error('Register error:', err.message);
        return res.status(400).json({ 
          success: false, 
          error: 'Email already registered' 
        });
      }

      res.json({
        success: true,
        message: 'Registered successfully!',
        userId: this.lastID,
        role,
        name: name || null,
        organization: organization || null
      });
    }
  );
});

/**
 * Login (both user and doctor)
 * POST /api/auth/login { email, password }
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email and password required' 
    });
  }

  db.get(
    'SELECT id, email, role, name, organization FROM users WHERE email = ? AND password = ?',
    [email, password],
    (err, user) => {
      if (err || !user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials' 
        });
      }

      res.json({
        success: true,
        userId: user.id,
        role: user.role,
        name: user.name,
        organization: user.organization,
        user
      });
    }
  );
});

module.exports = router;
