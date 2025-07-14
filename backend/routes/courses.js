const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'modulus-lms-secret-key-change-in-production';

// Middleware to verify JWT token
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

// Admin/Instructor middleware
const requireStaffOrAdmin = (req, res, next) => {
  if (!['admin', 'staff', 'instructor'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Staff or admin access required' });
  }
  next();
};

// Validation middleware for course creation
const validateCourse = [
  body('title').trim().isLength({ min: 2 }).withMessage('Course title must be at least 2 characters'),
  body('code').trim().isLength({ min: 2 }).withMessage('Course code must be at least 2 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('department').trim().isLength({ min: 2 }).withMessage('Department must be at least 2 characters'),
  body('academicLevel').isIn(['bachelor', 'master', 'phd', 'certificate']).withMessage('Valid academic level required'),
  body('duration').isInt({ min: 1, max: 10 }).withMessage('Duration must be between 1 and 10 years'),
  body('totalCredits').isInt({ min: 1 }).withMessage('Total credits must be a positive number')
];

// GET /api/courses - Get all courses
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const result = await db.query(
      `SELECT 
        id, title, code, description, department, academic_level, 
        duration, total_credits, created_at, updated_at,
        (SELECT name FROM users WHERE id = created_by) as created_by_name
       FROM courses 
       ORDER BY created_at DESC`
    );

    res.json({
      courses: result.rows.map(course => ({
        id: course.id,
        title: course.title,
        code: course.code,
        description: course.description,
        department: course.department,
        academicLevel: course.academic_level,
        duration: course.duration,
        totalCredits: course.total_credits,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        createdBy: course.created_by_name
      }))
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/courses/:id - Get a specific course
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;
    
    const result = await db.query(
      `SELECT 
        id, title, code, description, department, academic_level, 
        duration, total_credits, created_at, updated_at,
        (SELECT name FROM users WHERE id = created_by) as created_by_name
       FROM courses 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = result.rows[0];
    res.json({
      course: {
        id: course.id,
        title: course.title,
        code: course.code,
        description: course.description,
        department: course.department,
        academicLevel: course.academic_level,
        duration: course.duration,
        totalCredits: course.total_credits,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        createdBy: course.created_by_name
      }
    });

  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/courses - Create a new course
router.post('/', authenticateToken, requireStaffOrAdmin, validateCourse, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, code, description, department, academicLevel, duration, totalCredits } = req.body;
    const db = req.app.locals.db;

    // Check if course code already exists
    const existingCourse = await db.query(
      'SELECT id FROM courses WHERE code = $1',
      [code]
    );

    if (existingCourse.rows.length > 0) {
      return res.status(400).json({ error: 'Course with this code already exists' });
    }

    // Insert new course
    const result = await db.query(
      `INSERT INTO courses (title, code, description, department, academic_level, duration, total_credits, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, title, code, description, department, academic_level, duration, total_credits, created_at`,
      [title, code, description, department, academicLevel, duration, totalCredits, req.user.userId]
    );

    const course = result.rows[0];

    res.status(201).json({
      message: 'Course created successfully',
      course: {
        id: course.id,
        title: course.title,
        code: course.code,
        description: course.description,
        department: course.department,
        academicLevel: course.academic_level,
        duration: course.duration,
        totalCredits: course.total_credits,
        createdAt: course.created_at
      }
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/courses/:id - Update a course
router.put('/:id', authenticateToken, requireStaffOrAdmin, validateCourse, async (req, res) => {
  try {
    console.log('UPDATE COURSE - Request body:', req.body);
    console.log('UPDATE COURSE - Course ID:', req.params.id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('UPDATE COURSE - Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, code, description, department, academicLevel, duration, totalCredits } = req.body;
    const db = req.app.locals.db;

    // Check if course exists
    const existingCourse = await db.query(
      'SELECT id FROM courses WHERE id = $1',
      [id]
    );

    if (existingCourse.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if course code is taken by another course
    const codeCheck = await db.query(
      'SELECT id FROM courses WHERE code = $1 AND id != $2',
      [code, id]
    );

    if (codeCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Course code is already taken by another course' });
    }

    // Update course
    const result = await db.query(
      `UPDATE courses 
       SET title = $1, code = $2, description = $3, department = $4, 
           academic_level = $5, duration = $6, total_credits = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING id, title, code, description, department, academic_level, duration, total_credits, updated_at`,
      [title, code, description, department, academicLevel, duration, totalCredits, id]
    );

    const course = result.rows[0];

    res.json({
      message: 'Course updated successfully',
      course: {
        id: course.id,
        title: course.title,
        code: course.code,
        description: course.description,
        department: course.department,
        academicLevel: course.academic_level,
        duration: course.duration,
        totalCredits: course.total_credits,
        updatedAt: course.updated_at
      }
    });

  } catch (error) {
    console.error('UPDATE COURSE - Full error details:', error);
    console.error('UPDATE COURSE - Error message:', error.message);
    console.error('UPDATE COURSE - Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// DELETE /api/courses/:id - Delete a course
router.delete('/:id', authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;

    const result = await db.query(
      'DELETE FROM courses WHERE id = $1 RETURNING id, title, code',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({
      message: 'Course deleted successfully',
      course: result.rows[0]
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
