const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Middleware to verify JWT token (from auth.js)
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'modulus-lms-secret-key-change-in-production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

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

// Middleware to check if user is admin or staff
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// GET /api/users - Get all users (admin/staff only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { page = 1, limit = 20, role, search, approvalStatus } = req.query;
    
    let query = `
      SELECT id, email, name, role, is_approved, created_at, last_active,
             level, level_name, badges, streak_days, total_points
      FROM users 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Add filters
    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (approvalStatus === 'pending') {
      query += ` AND is_approved = false AND role = 'instructor'`;
    } else if (approvalStatus === 'approved') {
      query += ` AND is_approved = true`;
    }

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await db.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (role) {
      countParamCount++;
      countQuery += ` AND role = $${countParamCount}`;
      countParams.push(role);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (approvalStatus === 'pending') {
      countQuery += ` AND is_approved = false AND role = 'instructor'`;
    } else if (approvalStatus === 'approved') {
      countQuery += ` AND is_approved = true`;
    }

    const countResult = await db.query(countQuery, countParams);
    const totalUsers = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        hasMore: parseInt(page) * parseInt(limit) < totalUsers
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id - Get specific user
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;

    // Users can only view their own profile unless they're admin/staff
    if (req.user.userId !== parseInt(id) && req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(
      `SELECT id, email, name, role, is_approved, created_at, last_active,
              level, level_name, badges, streak_days, total_points,
              approved_by, approved_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id - Update user (admin/staff or own profile)
router.put('/:id', [
  authenticateToken,
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, email } = req.body;
    const db = req.app.locals.db;

    // Users can only update their own profile unless they're admin/staff
    if (req.user.userId !== parseInt(id) && req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (name) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }

    if (email) {
      paramCount++;
      updates.push(`email = $${paramCount}`);
      params.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    paramCount++;
    params.push(id);

    const query = `
      UPDATE users SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, name, role, is_approved, created_at, last_active
    `;

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// PUT /api/users/:id/approve - Approve instructor (admin only)
router.put('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;

    const result = await db.query(
      `UPDATE users 
       SET is_approved = true, approved_by = $1, approved_at = NOW()
       WHERE id = $2 AND role = 'instructor'
       RETURNING id, email, name, role, is_approved, approved_at`,
      [req.user.userId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instructor not found or already approved' });
    }

    res.json({
      message: 'Instructor approved successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;

    // Prevent admin from deleting themselves
    if (req.user.userId === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, email, name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User deleted successfully',
      deletedUser: result.rows[0]
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/pending/instructors - Get pending instructor approvals (admin/staff only)
router.get('/pending/instructors', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const result = await db.query(
      `SELECT id, email, name, created_at, last_active
       FROM users 
       WHERE role = 'instructor' AND is_approved = false
       ORDER BY created_at DESC`
    );

    res.json({
      pendingInstructors: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Get pending instructors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
