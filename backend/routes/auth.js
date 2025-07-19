const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const router = express.Router();

// Authentication middleware for local development
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
    return res.status(403).json({ message: 'Admin or staff access required' });
  }
  next();
};

// JWT secret (in production, this should be from environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'modulus-lms-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Access codes for different roles
const ROLE_ACCESS_CODES = {
  'student': 'student2025',
  'instructor': 'instructor2025',
  'staff': 'staff2025',
  'admin': 'mahtabmehek1337'
};

// Legacy access code (still works for backward compatibility)
const VALID_ACCESS_CODE = 'mahtabmehek1337';

// Function to update PostgreSQL sequence after manual ID insertion
const updateUserIdSequence = async (db) => {
  try {
    // Get the maximum ID from users table
    const maxIdResult = await db.query('SELECT MAX(id) as max_id FROM users');
    const maxId = maxIdResult.rows[0].max_id || 0;

    // Update the sequence to start from max_id + 1
    await db.query(`SELECT setval('users_id_seq', $1, true)`, [maxId]);

    console.log(`Updated users_id_seq to ${maxId}`);
  } catch (error) {
    console.error('Error updating user ID sequence:', error);
    // Don't throw - this is not critical for the operation
  }
};

// Function to generate role-based user ID
const generateRoleBasedUserId = async (role, db) => {
  let minId, maxId;

  switch (role) {
    case 'staff':
      minId = 100;
      maxId = 499;
      break;
    case 'instructor':
      minId = 500;
      maxId = 999;
      break;
    case 'student':
      minId = 1000;
      maxId = 4999;
      break;
    case 'admin':
      // Admins can use the system generated IDs or staff range
      minId = 1;
      maxId = 99;
      break;
    default:
      throw new Error('Invalid role for ID generation');
  }

  // More efficient approach: Get all existing IDs in range and find the first gap
  const result = await db.query(
    'SELECT id FROM users WHERE id >= $1 AND id <= $2 ORDER BY id',
    [minId, maxId]
  );

  const existingIds = new Set(result.rows.map(row => row.id));

  // Find the first available ID in the range
  for (let id = minId; id <= maxId; id++) {
    if (!existingIds.has(id)) {
      return id;
    }
  }

  throw new Error(`No available IDs in range ${minId}-${maxId} for role ${role}`);
};



// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('accessCode').custom((value, { req }) => {
    const role = req.body.role || 'student';
    const validCode = ROLE_ACCESS_CODES[role];
    if (value === VALID_ACCESS_CODE || value === validCode) {
      return true;
    }
    throw new Error(`Invalid access code for ${role} role`);
  }),
  body('role').optional().isIn(['student', 'instructor', 'admin', 'staff']).withMessage('Invalid role')
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
        message: 'Master access code is valid',
        allowedRoles: ['student', 'instructor', 'staff', 'admin']
      });
    }

    // Check role-specific access codes
    const roleForCode = Object.keys(ROLE_ACCESS_CODES).find(role =>
      ROLE_ACCESS_CODES[role] === accessCode
    );

    if (roleForCode) {
      return res.json({
        valid: true,
        message: `Access code is valid for ${roleForCode} role`,
        allowedRoles: [roleForCode]
      });
    }

    // Check database for other access codes (for future expansion)
    const db = pool;
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

// Helper function to determine role from access code
const getRoleFromAccessCode = (accessCode) => {
  // Check role-specific access codes
  const roleForCode = Object.keys(ROLE_ACCESS_CODES).find(role =>
    ROLE_ACCESS_CODES[role] === accessCode
  );

  if (roleForCode) {
    return roleForCode;
  }

  // Legacy access code defaults to admin
  if (accessCode === VALID_ACCESS_CODE) {
    return 'admin';
  }

  // Default to student for any other code
  return 'student';
};

// POST /api/auth/register
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role: requestedRole, accessCode } = req.body;

    // Determine role from access code
    const roleFromAccessCode = getRoleFromAccessCode(accessCode);

    // Validate that the requested role matches the access code
    if (requestedRole && requestedRole !== roleFromAccessCode) {
      console.log(`🚫 Role mismatch - Requested: ${requestedRole}, Access code allows: ${roleFromAccessCode}`);
      return res.status(400).json({
        error: 'Access code does not match requested role',
        errorType: 'ROLE_MISMATCH',
        message: `The access code provided is for ${roleFromAccessCode} role, but you selected ${requestedRole}. Please use the correct access code.`
      });
    }

    const role = roleFromAccessCode;
    console.log(`🔧 Access code: ${accessCode} mapped to role: ${role}`);

    const db = pool;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: 'User already exists',
        errorType: 'USER_EXISTS',
        message: 'An account with this email already exists. Try logging in instead.'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate role-based user ID
    const userId = await generateRoleBasedUserId(role, db);

    // Insert new user with specific ID
    // Only admin accounts are auto-approved, all others require staff approval
    const isAutoApproved = (role === 'admin');
    console.log(`🔧 User registration - Role: ${role}, Auto-approved: ${isAutoApproved}`);

    const result = await db.query(
      `INSERT INTO users (id, email, password_hash, name, role, is_approved, created_at, last_active)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, email, name, role, is_approved, created_at`,
      [userId, email, passwordHash, name, role, isAutoApproved] // Only auto-approve admins, others need staff approval
    );

    const user = result.rows[0];

    // Update the PostgreSQL sequence to prevent conflicts
    await updateUserIdSequence(db);

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
      requiresApproval: (role !== 'admin')
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
    const db = pool;

    // Get user from database
    const result = await db.query(
      'SELECT id, email, password_hash, name, role, is_approved, created_at, last_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found',
        errorType: 'USER_NOT_FOUND',
        message: 'No account found with this email address. Please check your email or register for a new account.'
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Incorrect password',
        errorType: 'INVALID_PASSWORD',
        message: 'The password you entered is incorrect. Please try again.'
      });
    }

    // Note: We allow pending users to login, but the frontend will show them the pending approval view
    // Check if user is approved (only admins are auto-approved, all others need approval)
    // if (user.role !== 'admin' && !user.is_approved) {
    //   console.log(`🚫 Login blocked - ${user.role} user ${user.email} not approved`);
    //   return res.status(403).json({
    //     error: 'Account pending approval',
    //     message: `Your ${user.role} account is pending approval from staff or administrator`
    //   });
    // }

    console.log(`✅ Login successful - ${user.role} user ${user.email}`);

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
    const db = pool;
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
    const db = pool;

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

// POST /api/auth/create-test-users - For development/testing only
router.post('/create-test-users', async (req, res) => {
  try {
    // Allow in production only with special authorization
    if (process.env.NODE_ENV === 'production') {
      const authHeader = req.headers['x-admin-setup'];
      if (authHeader !== 'modulus-setup-2025') {
        return res.status(403).json({ error: 'Not available in production without proper authorization' });
      }
    }

    const db = pool;
    const saltRounds = 12;

    const testUsers = [
      {
        email: 'student@test.com',
        password: 'student123',
        name: 'Test Student',
        role: 'student',
        isApproved: true
      },
      {
        email: 'instructor@test.com',
        password: 'instructor123',
        name: 'Test Instructor',
        role: 'instructor',
        isApproved: true
      },
      {
        email: 'admin@test.com',
        password: 'admin123',
        name: 'Test Admin',
        role: 'admin',
        isApproved: true
      }
    ];

    const createdUsers = [];

    for (const testUser of testUsers) {
      // Check if user already exists
      const existing = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [testUser.email]
      );

      if (existing.rows.length === 0) {
        // Hash password
        const passwordHash = await bcrypt.hash(testUser.password, saltRounds);

        // Insert user
        const result = await db.query(
          `INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           RETURNING id, email, name, role`,
          [testUser.email, passwordHash, testUser.name, testUser.role, testUser.isApproved]
        );

        createdUsers.push({
          ...result.rows[0],
          password: testUser.password // Return plain password for testing
        });
      } else {
        // User already exists, update password for testing
        const passwordHash = await bcrypt.hash(testUser.password, saltRounds);

        await db.query(
          'UPDATE users SET password_hash = $1, is_approved = $2 WHERE email = $3',
          [passwordHash, testUser.isApproved, testUser.email]
        );

        const userInfo = await db.query(
          'SELECT id, email, name, role FROM users WHERE email = $1',
          [testUser.email]
        );

        createdUsers.push({
          ...userInfo.rows[0],
          password: testUser.password, // Return plain password for testing
          existed: true
        });
      }
    }

    res.json({
      message: 'Test users created/verified successfully',
      users: createdUsers
    });

  } catch (error) {
    console.error('Create test users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// GET /api/auth/admin/pending-approvals - Get users pending approval
router.get('/admin/pending-approvals', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = pool;

    const result = await db.query(
      `SELECT id, email, name, role, created_at 
       FROM users 
       WHERE is_approved = false AND (role = 'instructor' OR role = 'staff')
       ORDER BY created_at DESC`
    );

    res.json({
      pendingApprovals: result.rows.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        appliedDate: user.created_at
      }))
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/admin/approve-user - Approve a user
router.post('/admin/approve-user', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    const db = pool;

    const result = await db.query(
      `UPDATE users 
       SET is_approved = true 
       WHERE id = $1 AND is_approved = false
       RETURNING id, email, name, role`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or already approved' });
    }

    res.json({
      message: 'User approved successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/admin/reject-user - Reject a user
router.post('/admin/reject-user', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    const database = pool;

    const deleteResult = await database.query(
      `DELETE FROM users 
       WHERE id = $1 AND is_approved = false
       RETURNING id, email, name, role`,
      [userId]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or already approved' });
    }

    res.json({
      message: 'User rejected and removed successfully',
      user: deleteResult.rows[0]
    });

  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/admin/users - Get all users (admin only)
router.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const database = pool;

    const usersResult = await database.query(
      `SELECT id, email, name, role, is_approved, created_at, last_active 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json({
      users: usersResult.rows.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.is_approved,
        joinedAt: user.created_at,
        lastActive: user.last_active
      }))
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/admin/create-user - Create a new user (admin only)
router.post('/admin/create-user', authenticateToken, requireAdmin,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('role').isIn(['student', 'instructor', 'staff', 'admin']).withMessage('Valid role required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, role } = req.body;
      const db = pool;

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

      // Insert new user (admin-created users are auto-approved)
      const result = await db.query(
        `INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())
         RETURNING id, email, name, role, is_approved, created_at`,
        [email, passwordHash, name, role]
      );

      const user = result.rows[0];

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isApproved: user.is_approved,
          joinedAt: user.created_at
        }
      });

    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/auth/admin/disable-user - Disable a user
router.post('/admin/disable-user', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = pool;

    // Update user to set them as disabled
    const result = await db.query(
      'UPDATE users SET is_approved = false WHERE id = $1 RETURNING *',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      message: 'User disabled successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.is_approved
      }
    });

  } catch (error) {
    console.error('Disable user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/admin/enable-user - Enable a disabled user
router.post('/admin/enable-user', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = pool;

    // Update user to set them as enabled (approved)
    const result = await db.query(
      'UPDATE users SET is_approved = true WHERE id = $1 RETURNING *',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      message: 'User enabled successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.is_approved
      }
    });

  } catch (error) {
    console.error('Enable user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/auth/admin/delete-user - Delete a user from database
router.delete('/admin/delete-user', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = pool;

    // Check if user exists first
    const checkResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete the user
    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/admin/update-user/:id - Update user information
router.put('/admin/update-user/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, is_approved, courseId } = req.body;

    console.log('UPDATE USER - Request:', { id, name, email, role, is_approved, courseId });

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = pool;
    const userId = parseInt(id, 10);

    // Check if user exists
    const checkResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = checkResult.rows[0];

    // Build update query dynamically based on provided fields
    let updateFields = [];
    let updateValues = [];
    let paramCount = 1;

    if (name !== undefined && name !== currentUser.name) {
      updateFields.push(`name = $${paramCount}`);
      updateValues.push(name);
      paramCount++;
    }

    if (email !== undefined && email !== currentUser.email) {
      // Check if email is already taken by another user
      const emailCheck = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email is already taken by another user' });
      }

      updateFields.push(`email = $${paramCount}`);
      updateValues.push(email);
      paramCount++;
    }

    if (role !== undefined && role !== currentUser.role) {
      updateFields.push(`role = $${paramCount}`);
      updateValues.push(role);
      paramCount++;
    }

    if (is_approved !== undefined && is_approved !== currentUser.is_approved) {
      updateFields.push(`is_approved = $${paramCount}`);
      updateValues.push(is_approved);
      paramCount++;
    }

    if (courseId !== undefined && courseId !== currentUser.course_id) {
      updateFields.push(`course_id = $${paramCount}`);
      updateValues.push(courseId);
      paramCount++;
    }

    // If no fields to update, return current user
    if (updateFields.length === 0) {
      return res.json({
        message: 'No changes detected',
        user: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          isApproved: currentUser.is_approved,
          courseId: currentUser.course_id,
          createdAt: currentUser.created_at
        }
      });
    }

    // Add user ID for WHERE clause
    updateValues.push(userId);
    const whereParam = `$${paramCount}`;

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = ${whereParam} 
      RETURNING *
    `;

    console.log('UPDATE USER - Query:', updateQuery);
    console.log('UPDATE USER - Values:', updateValues);

    const result = await db.query(updateQuery, updateValues);
    const updatedUser = result.rows[0];

    console.log('UPDATE USER - Success:', updatedUser);

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isApproved: updatedUser.is_approved,
        courseId: updatedUser.course_id,
        createdAt: updatedUser.created_at
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
