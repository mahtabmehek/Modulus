const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'modulus-lms-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  console.log('🔑 COURSE AUTH - Headers:', req.headers['authorization']);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ COURSE AUTH - No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ COURSE AUTH - Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    console.log('✅ COURSE AUTH - User authenticated:', user.email, 'Role:', user.role);
    req.user = user;
    next();
  });
};

// Admin/Instructor middleware
const requireStaffOrAdmin = (req, res, next) => {
  console.log('👤 COURSE ROLE CHECK - User role:', req.user?.role);
  if (!['admin', 'staff', 'instructor'].includes(req.user.role)) {
    console.log('❌ COURSE ROLE CHECK - Access denied for role:', req.user.role);
    return res.status(403).json({ error: 'Staff or admin access required' });
  }
  console.log('✅ COURSE ROLE CHECK - Access granted for role:', req.user.role);
  next();
};

// Validation middleware for course creation
const validateCourse = [
  body('title').trim().isLength({ min: 2 }).withMessage('Course title must be at least 2 characters'),
  body('code').trim().isLength({ min: 2 }).withMessage('Course code must be at least 2 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('department').trim().isLength({ min: 2 }).withMessage('Department must be at least 2 characters'),
  body('academicLevel').isIn(['bachelor', 'master', 'phd', 'certificate']).withMessage('Valid academic level required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive number'),
  body('totalCredits').isInt({ min: 1 }).withMessage('Total credits must be a positive number')
];

// GET /api/courses - Get all courses
router.get('/', async (req, res) => {
  try {
    const db = pool;

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

// GET /api/courses/my-course - Get current user's assigned course (MUST BE BEFORE /:id route)
router.get('/my-course', authenticateToken, async (req, res) => {
  try {
    console.log('=== MY COURSE DEBUG START ===');
    console.log('GET MY COURSE - User:', req.user.userId, req.user.email);
    const db = pool;
    console.log('Database connection:', !!db);
    // Get the user's assigned course_code
    console.log('Querying user course_code...');
    const userResult = await db.query(
      'SELECT course_code FROM users WHERE id = $1', [req.user.userId]);
    console.log('User query result:', userResult.rows);
    const user = userResult.rows[0];
    if (!user || !user.course_code) {
      console.log('MY COURSE - No course assigned to user');
      return res.json({
        success: true,
        course: null});}

    console.log('MY COURSE - User course code:', user.course_code);

    // Get the course by code
    const courseQuery = `
      SELECT 
        id,
        title,
        code,
        description,
        department,
        academic_level,
        duration,
        total_credits
      FROM courses 
      WHERE code = $1
    `;

    const courseResult = await db.query(courseQuery, [user.course_code]);

    if (courseResult.rows.length === 0) {
      console.log('MY COURSE - Course not found for code:', user.course_code);
      return res.json({
        success: true,
        course: null
      });
    }

    const course = courseResult.rows[0];
    console.log('MY COURSE - Found course:', course);

    // Get modules for this course
    console.log('MY COURSE - Querying modules for course_id:', course.id);
    const modulesQuery = `
      SELECT 
        id,
        title,
        description,
        order_index
      FROM modules 
      WHERE course_id = $1
      ORDER BY order_index
    `;

    const modulesResult = await db.query(modulesQuery, [course.id]);
    console.log('MY COURSE - Found modules:', modulesResult.rows.length);

    // Get labs for each module
    const modules = [];
    for (const module of modulesResult.rows) {
      const labsQuery = `
        SELECT 
          l.id,
          l.title,
          l.description,
          l.estimated_minutes,
          l.points_possible,
          ml.order_index
        FROM labs l
        JOIN module_labs ml ON l.id = ml.lab_id
        WHERE ml.module_id = $1
        ORDER BY ml.order_index
      `;

      console.log('MY COURSE - Querying labs for module:', module.id);
      const labsResult = await db.query(labsQuery, [module.id]);
      console.log('MY COURSE - Found labs for module:', module.id, 'count:', labsResult.rows.length);

      modules.push({
        id: module.id,
        title: module.title,
        description: module.description,
        orderIndex: module.order_index,
        labs: labsResult.rows.map(lab => ({
          id: lab.id,
          title: lab.title,
          description: lab.description,
          difficulty: 'intermediate',
          estimatedDuration: lab.estimated_minutes || 30,
          orderIndex: lab.order_index,
          status: 'not_started',
          completedAt: null,
          score: null
        })),
        completedLabs: 0,
        totalLabs: labsResult.rows.length
      });
    }

    const courseData = {
      id: course.id,
      title: course.title,
      code: course.code,
      description: course.description,
      department: course.department,
      academicLevel: course.academic_level,
      duration: course.duration,
      totalCredits: course.total_credits,
      completionPercentage: 0,
      modules: modules
    };

    console.log('MY COURSE - Returning course:', courseData.title);

    res.json({
      success: true,
      course: courseData
    });

  } catch (error) {
    console.error('=== MY COURSE ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/courses/:id - Get a specific course
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = pool;

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

    // Fetch modules for this course
    const modulesResult = await db.query(
      `SELECT id, title, description, order_index
       FROM modules 
       WHERE course_id = $1
       ORDER BY order_index`,
      [id]
    );

    // Fetch labs for each module
    const modules = [];
    for (const module of modulesResult.rows) {
      const labsResult = await db.query(
        `SELECT l.id, l.title, l.description, ml.order_index
         FROM labs l
         JOIN module_labs ml ON l.id = ml.lab_id
         WHERE ml.module_id = $1
         ORDER BY ml.order_index`,
        [module.id]
      );

      modules.push({
        id: module.id.toString(),
        title: module.title,
        description: module.description,
        order_index: module.order_index,
        labs: labsResult.rows.map(lab => ({
          id: lab.id,
          title: lab.title,
          description: lab.description
        }))
      });
    }

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
        createdBy: course.created_by_name,
        modules: modules
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
    console.log('CREATE COURSE - Request body:', req.body);
    console.log('CREATE COURSE - Body types:', {
      duration: typeof req.body.duration,
      totalCredits: typeof req.body.totalCredits,
      durationValue: req.body.duration,
      totalCreditsValue: req.body.totalCredits
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('CREATE COURSE - Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, code, description, department, academicLevel, duration, totalCredits } = req.body;
    const db = pool;

    // Ensure integer types for database operations
    const parsedDuration = parseInt(duration, 10);
    const parsedTotalCredits = parseInt(totalCredits, 10);

    console.log('CREATE COURSE - Parsed values:', {
      parsedDuration,
      parsedTotalCredits,
      userId: req.user.userId
    });

    // Check if course code already exists
    const existingCourse = await db.query(
      'SELECT id FROM courses WHERE code = $1',
      [code]
    );

    if (existingCourse.rows.length > 0) {
      return res.status(400).json({ error: 'Course with this code already exists' });
    }

    console.log('CREATE COURSE - About to insert with values:', {
      title, code, description, department, academicLevel,
      duration: parsedDuration, totalCredits: parsedTotalCredits, userId: req.user.userId
    });

    // Insert new course
    const result = await db.query(
      `INSERT INTO courses (title, code, description, department, academic_level, duration, total_credits, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, title, code, description, department, academic_level, duration, total_credits, created_at`,
      [title, code, description, department, academicLevel, parsedDuration, parsedTotalCredits, req.user.userId]
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
    console.log('UPDATE COURSE - Body types:', {
      duration: typeof req.body.duration,
      totalCredits: typeof req.body.totalCredits,
      durationValue: req.body.duration,
      totalCreditsValue: req.body.totalCredits
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('UPDATE COURSE - Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, code, description, department, academicLevel, duration, totalCredits } = req.body;
    const db = pool;

    // Ensure integer types for database queries
    const parsedDuration = parseInt(duration, 10);
    const parsedTotalCredits = parseInt(totalCredits, 10);

    console.log('UPDATE COURSE - Parsed values:', {
      parsedDuration,
      parsedTotalCredits,
      id: parseInt(id, 10)
    });

    // Check if course exists
    console.log('UPDATE COURSE - Checking if course exists with ID:', id);
    const existingCourse = await db.query(
      'SELECT id FROM courses WHERE id = $1',
      [parseInt(id, 10)]
    );

    if (existingCourse.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    console.log('UPDATE COURSE - Course exists, checking code uniqueness');
    // Check if course code is taken by another course
    const codeCheck = await db.query(
      'SELECT id FROM courses WHERE code = $1 AND id <> $2',
      [code, parseInt(id, 10)]
    );

    if (codeCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Course code is already taken by another course' });
    }

    console.log('UPDATE COURSE - About to update course with values:', {
      title, code, description, department, academicLevel,
      duration: parsedDuration, totalCredits: parsedTotalCredits, id: parseInt(id, 10)
    });

    console.log('UPDATE COURSE - Parameter types:', {
      title: typeof title,
      code: typeof code,
      description: typeof description,
      department: typeof department,
      academicLevel: typeof academicLevel,
      duration: typeof parsedDuration,
      totalCredits: typeof parsedTotalCredits,
      id: typeof id
    });

    // Update course
    const result = await db.query(
      `UPDATE courses 
       SET title = $1, code = $2, description = $3, department = $4, 
           academic_level = $5, duration = $6, total_credits = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING id, title, code, description, department, academic_level, duration, total_credits, updated_at`,
      [title, code, description, department, academicLevel, parsedDuration, parsedTotalCredits, parseInt(id, 10)]
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
    const db = pool;
    const courseId = parseInt(id, 10);

    console.log(`� DELETE COURSE - Checking dependencies for course ID: ${courseId}`);

    // Check if course exists
    const courseCheck = await db.query('SELECT id, title FROM courses WHERE id = $1', [courseId]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const courseTitle = courseCheck.rows[0].title;

    // Check for dependencies
    const dependencies = {};

    // Check modules
    const modules = await db.query('SELECT COUNT(*) FROM modules WHERE course_id = $1', [courseId]);
    dependencies.modules = parseInt(modules.rows[0].count);

    // Check users assigned to this course (by course code)
    const courseCodeResult = await db.query('SELECT code FROM courses WHERE id = $1', [courseId]);
    const courseCode = courseCodeResult.rows[0]?.code;
    const users = await db.query('SELECT COUNT(*) FROM users WHERE course_code = $1', [courseCode]);
    dependencies.assignedUsers = parseInt(users.rows[0].count);

    const totalDependencies = dependencies.modules + dependencies.assignedUsers;

    console.log(`� DELETE COURSE - Dependencies found:`, dependencies);

    // If course has dependencies, return error with details
    if (totalDependencies > 0) {
      const dependencyList = [];
      if (dependencies.modules > 0) dependencyList.push(`${dependencies.modules} module(s)`);
      if (dependencies.assignedUsers > 0) dependencyList.push(`${dependencies.assignedUsers} assigned user(s)`);

      return res.status(400).json({
        error: 'Cannot delete course with dependencies',
        message: `Course "${courseTitle}" cannot be deleted because it has dependencies: ${dependencyList.join(', ')}.`,
        dependencies: dependencies,
        hasDependencies: true
      });
    }

    // If no dependencies, proceed with deletion
    // First delete any announcements for this course
    await db.query('DELETE FROM announcements WHERE course_id = $1', [courseId]);

    // Then delete the course
    const result = await db.query(
      'DELETE FROM courses WHERE id = $1 RETURNING id, title, code',
      [courseId]
    );

    console.log(`✅ DELETE COURSE - Successfully deleted course: "${courseTitle}"`);

    res.json({
      message: 'Course deleted successfully',
      course: result.rows[0]
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// PUT /api/courses/:id/modules - Save course modules
router.put('/:id/modules', authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { modules } = req.body;
    const db = pool;

    console.log('SAVE MODULES - Course ID:', id);
    console.log('SAVE MODULES - Modules data:', JSON.stringify(modules, null, 2));

    // Check if course exists
    const courseCheck = await db.query(
      'SELECT id FROM courses WHERE id = $1',
      [parseInt(id, 10)]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Begin transaction
    await db.query('BEGIN');

    try {
      // Debug: Check if we can see labs inside the transaction
      const allLabsInTransaction = await db.query('SELECT id, title FROM labs ORDER BY id');
      console.log('🔍 Labs visible in transaction:', allLabsInTransaction.rows.map(l => `${l.id}:${l.title}`));

      // First, delete existing modules for this course
      await db.query(
        'DELETE FROM modules WHERE course_id = $1',
        [parseInt(id, 10)]
      );

      // Insert new modules
      for (const module of modules) {
        console.log('Inserting module:', module);

        const moduleResult = await db.query(
          `INSERT INTO modules (course_id, title, description, order_index, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           RETURNING id`,
          [parseInt(id, 10), module.title, module.description, module.order_index]
        );

        const moduleId = moduleResult.rows[0].id;
        console.log('Inserted module with ID:', moduleId);

        // Insert labs for this module if any
        if (module.labs && module.labs.length > 0) {
          for (let i = 0; i < module.labs.length; i++) {
            const lab = module.labs[i];
            console.log('Linking existing lab to module:', lab);
            console.log('Lab ID type:', typeof lab.id, 'Value:', lab.id);

            // Verify the lab exists before linking
            const labCheck = await db.query('SELECT id FROM labs WHERE id = $1', [lab.id]);
            console.log('Lab exists check:', labCheck.rows.length > 0 ? 'YES' : 'NO');

            if (labCheck.rows.length === 0) {
              console.log('❌ SKIPPING - Lab ID', lab.id, 'does not exist in labs table');
              continue;
            }

            // Use module_labs junction table to link existing labs to this module
            // The lab.id should be the existing lab ID from the database
            try {
              await db.query(
                `INSERT INTO module_labs (module_id, lab_id, order_index)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (module_id, lab_id) DO UPDATE SET order_index = EXCLUDED.order_index`,
                [moduleId, lab.id, i]
              );
              console.log('✅ Successfully linked lab', lab.id, 'to module', moduleId);
            } catch (linkError) {
              console.log('❌ Failed to link lab', lab.id, 'to module', moduleId, ':', linkError.message);
              throw linkError; // Re-throw to trigger transaction rollback
            }
          }
        }
      }

      // Commit transaction
      await db.query('COMMIT');

      console.log('SAVE MODULES - Successfully saved all modules');
      res.json({
        message: 'Course modules saved successfully',
        moduleCount: modules.length
      });

    } catch (error) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Save modules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
