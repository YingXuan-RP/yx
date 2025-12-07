const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const router = express.Router();

// Login page
router.get('/login', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/dashboard');
  }
  res.sendFile('login.html', { root: './public' });
});

// Login API
router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Query the users table for admin role
    db.query(
      'SELECT * FROM users WHERE email = ? AND role = ?',
      [email, 'admin'],
      async (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Server error during login' });
        }

        if (results.length === 0) {
          return res.status(401).json({ error: 'Invalid credentials or not an admin' });
        }

        const admin = results[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set session
        req.session.adminId = admin.id;
        req.session.adminEmail = admin.email;
        req.session.adminName = admin.name;
        req.session.adminRole = admin.role;

        res.json({
          success: true,
          message: 'Login successful',
          admin: {
            name: admin.name,
            email: admin.email,
            role: admin.role
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Logout
router.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check session
router.get('/api/auth/check', (req, res) => {
  if (req.session && req.session.adminId) {
    res.json({
      authenticated: true,
      admin: {
        name: req.session.adminName,
        email: req.session.adminEmail
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;
