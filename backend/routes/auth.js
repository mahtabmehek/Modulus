const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// JWT secret (in production, this should be from environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'modulus-lms-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Access code for registration (your requirement)
const VALID_ACCESS_CODE = 'mahtabmehek1337';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('accessCode').equals(VALID_ACCESS_CODE).withMessage('Invalid access code'),
  body('role').optional().isIn(['student', 'instructor']).withMessage('Invalid role')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
];

// POST /api/auth/validate-access-code
router.post('/validate-access-code', [
  body('accessCode').notEmpty().withMessage('Access code required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { accessCode } = req.body;

    // Check if access code is valid
    if (accessCode === VALID_ACCESS_CODE) {
      return res.json({
        valid: true,
        message: 'Access code is valid',
        allowedRoles: ['student', 'instructor']
      });
    }

    // Check database for other access codes (for future expansion)
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM access_codes WHERE code = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > NOW())',
      [accessCode]
    );

    if (result.rows.length > 0) {
      const code = result.rows[0];
      return res.json({
        valid: true,
        message: 'Access code is valid',
        allowedRoles: [code.role]
      });
    }

    return res.status(400).json({
      valid: false,
      error: 'Invalid or expired access code'
    });

  } catch (error) {
    console.error('Access code validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role = 'student' } = req.body;
    const db = req.app.locals.db;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, name, role, is_approved, created_at`,
      [email, passwordHash, name, role, role === 'student'] // Auto-approve students, instructors need approval
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        isApproved: user.is_approved
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.is_approved,
        joinedAt: user.created_at
      },
      token,
      requiresApproval: role === 'instructor'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const db = req.app.locals.db;

    // Get user from database
    const result = await db.query(
      'SELECT id, email, password_hash, name, role, is_approved, created_at, last_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is approved (for instructors)
    if (user.role === 'instructor' && !user.is_approved) {
      return res.status(403).json({ 
        error: 'Account pending approval',
        message: 'Your instructor account is pending approval from an administrator'
      });
    }

    // Update last active
    await db.query(
      'UPDATE users SET last_active = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        isApproved: user.is_approved
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.is_approved,
        joinedAt: user.created_at,
        lastActive: user.last_active
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  // In a stateless JWT system, logout is handled client-side by removing the token
  // For additional security, you could maintain a blacklist of tokens
  res.json({ message: 'Logout successful' });
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      `SELECT id, email, name, role, is_approved, created_at, last_active,
              level, level_name, badges, streak_days, total_points
       FROM users WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.is_approved,
        joinedAt: user.created_at,
        lastActive: user.last_active,
        level: user.level || 1,
        levelName: user.level_name || 'Beginner',
        badges: user.badges || [],
        streakDays: user.streak_days || 0,
        totalPoints: user.total_points || 0
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', [
  authenticateToken,
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const db = req.app.locals.db;

    // Get current user
    const result = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, req.user.userId]
    );

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
