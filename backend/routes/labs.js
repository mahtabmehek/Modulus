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

// Database configuration
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'modulus',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// GET /api/labs - Get all labs (with optional module filter)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { module_id } = req.query;
    
    let query = `
      SELECT l.*, m.title as module_title, m.course_id 
      FROM labs l
      JOIN modules m ON l.module_id = m.id
    `;
    let params = [];
    
    if (module_id) {
      query += ' WHERE l.module_id = $1';
      params = [module_id];
    }
    
    query += ' ORDER BY l.created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching labs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch labs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/labs/:id - Get specific lab details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT l.*, m.title as module_title, m.course_id, c.title as course_title
      FROM labs l
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE l.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lab not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching lab:', error);
    res.status(500).json({ 
      error: 'Failed to fetch lab details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/labs - Create new lab (Admin/Instructor only)
router.post('/', 
  authenticateToken, 
  requireStaffOrAdmin,
  [
    body('module_id').isInt().withMessage('Valid module ID is required'),
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title must be 1-255 characters'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description must be under 2000 characters'),
    body('lab_type').isIn(['vm', 'container', 'web', 'simulation']).withMessage('Valid lab type required (vm, container, web, simulation)'),
    body('vm_image').optional().isLength({ max: 255 }).withMessage('VM image name too long'),
    body('container_image').optional().isLength({ max: 255 }).withMessage('Container image name too long'),
    body('required_tools').optional().isArray().withMessage('Required tools must be an array'),
    body('network_requirements').optional().isLength({ max: 1000 }).withMessage('Network requirements too long'),
    body('points_possible').optional().isInt({ min: 0 }).withMessage('Points must be non-negative integer'),
    body('estimated_minutes').optional().isInt({ min: 1 }).withMessage('Estimated minutes must be positive'),
    body('icon_path').optional().isLength({ max: 500 }).withMessage('Icon path too long'),
    body('tags').optional().isArray().withMessage('Tags must be an array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        module_id,
        title,
        description,
        lab_type,
        vm_image,
        container_image,
        required_tools,
        network_requirements,
        points_possible,
        estimated_minutes,
        icon_path,
        tags,
        tasks // Add tasks to the expected fields
      } = req.body;

      // Verify module exists and user has access
      const moduleCheck = await pool.query(
        'SELECT id FROM modules WHERE id = $1',
        [module_id]
      );
      
      if (moduleCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Module not found' });
      }

      // Get next order index
      const orderResult = await pool.query(
        'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM labs WHERE module_id = $1',
        [module_id]
      );
      const finalOrderIndex = orderResult.rows[0].next_order;

      // Use lab_type directly - must match database constraint: 'vm', 'container', 'web', 'simulation'
      const dbLabType = lab_type;
      
      // Debug logging
      console.log('DEBUG LAB CREATION:');
      console.log('- Original lab_type:', lab_type);
      console.log('- Using lab_type directly:', dbLabType);

      const query = `
        INSERT INTO labs (
          module_id, title, description, lab_type, vm_image, 
          container_image, required_tools, network_requirements, 
          points_possible, estimated_minutes, order_index, icon_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const values = [
        module_id,
        title,
        description || null,
        dbLabType,
        vm_image || null,
        container_image || null,
        required_tools || null, // Pass array directly for PostgreSQL array type
        network_requirements || null,
        points_possible || 0,
        estimated_minutes || null,
        finalOrderIndex,
        icon_path || null // Store icon_path in icon_url column for now
      ];
      
      // Debug values array
      console.log('DEBUG VALUES ARRAY:');
      console.log('Values array:', values);
      console.log('lab_type value at index 3:', values[3]);

      const result = await pool.query(query, values);
      const createdLab = result.rows[0];

      // Save tasks and questions if provided
      if (tasks && Array.isArray(tasks) && tasks.length > 0) {
        for (let i = 0; i < tasks.length; i++) {
          const task = tasks[i];
          
          // Insert task
          const taskResult = await pool.query(
            'INSERT INTO tasks (lab_id, title, description, order_index) VALUES ($1, $2, $3, $4) RETURNING id',
            [createdLab.id, task.title, task.description, i + 1]
          );
          const taskId = taskResult.rows[0].id;
          
          // Insert questions for this task
          if (task.questions && Array.isArray(task.questions)) {
            for (let j = 0; j < task.questions.length; j++) {
              const question = task.questions[j];
              
              await pool.query(`
                INSERT INTO questions (
                  task_id, type, title, description, expected_answer, 
                  is_required, points, order_index, images, attachments, 
                  multiple_choice_options, hints
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              `, [
                taskId,
                question.type,
                question.title,
                question.description,
                question.flag || question.expectedAnswer || null,
                !question.isOptional, // Convert isOptional to is_required (inverse)
                question.points || 0,
                j + 1,
                question.images || null,
                question.attachments || null,
                question.multipleChoiceOptions ? JSON.stringify(question.multipleChoiceOptions) : null,
                question.hints || null
              ]);
            }
          }
        }
      }

      res.status(201).json({
        success: true,
        message: 'Lab created successfully',
        data: createdLab
      });
    } catch (error) {
      console.error('Error creating lab:', error);
      res.status(500).json({ 
        error: 'Failed to create lab',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// PUT /api/labs/:id - Update lab (Admin/Instructor only)
router.put('/:id',
  authenticateToken,
  requireStaffOrAdmin,
  [
    body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be 1-255 characters'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description must be under 2000 characters'),
    body('lab_type').optional().isIn(['vm', 'container', 'web', 'simulation']).withMessage('Valid lab type required (vm, container, web, simulation)'),
    body('vm_image').optional().isLength({ max: 255 }).withMessage('VM image name too long'),
    body('container_image').optional().isLength({ max: 255 }).withMessage('Container image name too long'),
    body('required_tools').optional().isArray().withMessage('Required tools must be an array'),
    body('network_requirements').optional().isLength({ max: 1000 }).withMessage('Network requirements too long'),
    body('points_possible').optional().isInt({ min: 0 }).withMessage('Points must be non-negative integer'),
    body('estimated_minutes').optional().isInt({ min: 1 }).withMessage('Estimated minutes must be positive'),
    body('icon_path').optional().isLength({ max: 500 }).withMessage('Icon path too long'),
    body('tags').optional().isArray().withMessage('Tags must be an array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const updates = req.body;

      // Check if lab exists
      const labCheck = await pool.query('SELECT id FROM labs WHERE id = $1', [id]);
      if (labCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Lab not found' });
      }

      // Use lab_type directly - no mapping needed, must match database constraint

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramCounter = 1;

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          updateFields.push(`${key} = $${paramCounter}`);
          updateValues.push(
            // Pass arrays directly for PostgreSQL array types (tags, required_tools)
            updates[key]
          );
          paramCounter++;
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id);

      const query = `
        UPDATE labs 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `;

      const result = await pool.query(query, updateValues);

      res.json({
        success: true,
        message: 'Lab updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating lab:', error);
      res.status(500).json({ 
        error: 'Failed to update lab',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// DELETE /api/labs/:id - Delete lab (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    // Check if lab exists
    const labCheck = await pool.query('SELECT id FROM labs WHERE id = $1', [id]);
    if (labCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    // Check for active lab sessions
    const activeSessions = await pool.query(
      'SELECT id FROM lab_sessions WHERE lab_id = $1 AND status = $2',
      [id, 'active']
    );

    if (activeSessions.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete lab with active sessions',
        details: `${activeSessions.rows.length} active session(s) found`
      });
    }

    await pool.query('DELETE FROM labs WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Lab deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lab:', error);
    res.status(500).json({ 
      error: 'Failed to delete lab',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/labs/:id/sessions - Get lab sessions for a specific lab
router.get('/:id/sessions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    let query = `
      SELECT ls.*, u.username, u.email
      FROM lab_sessions ls
      JOIN users u ON ls.user_id = u.id
      WHERE ls.lab_id = $1
    `;
    let params = [id];

    if (status) {
      query += ' AND ls.status = $2';
      params.push(status);
    }

    query += ' ORDER BY ls.created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching lab sessions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch lab sessions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/labs/:id/start - Start a lab session
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if lab exists
    const labResult = await pool.query('SELECT * FROM labs WHERE id = $1', [id]);
    if (labResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    const lab = labResult.rows[0];

    // Check for existing active session for this user and lab
    const existingSession = await pool.query(
      'SELECT id FROM lab_sessions WHERE user_id = $1 AND lab_id = $2 AND status = $3',
      [userId, id, 'active']
    );

    if (existingSession.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Active session already exists for this lab',
        sessionId: existingSession.rows[0].id
      });
    }

    // Create new lab session
    const sessionQuery = `
      INSERT INTO lab_sessions (
        user_id, lab_id, status, vm_instance_id, container_id
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    // For now, we'll create a placeholder session
    // In a real implementation, you'd integrate with AWS EC2/ECS or Docker
    const sessionValues = [
      userId,
      id,
      'active',
      lab.lab_type === 'virtual_machine' ? `vm-${Date.now()}` : null,
      lab.lab_type === 'container' ? `container-${Date.now()}` : null
    ];

    const sessionResult = await pool.query(sessionQuery, sessionValues);

    res.json({
      success: true,
      message: 'Lab session started successfully',
      data: {
        session: sessionResult.rows[0],
        lab: lab
      }
    });
  } catch (error) {
    console.error('Error starting lab session:', error);
    res.status(500).json({ 
      error: 'Failed to start lab session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/labs/:id/stop - Stop a lab session
router.post('/:id/stop', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Find active session
    const sessionResult = await pool.query(
      'SELECT * FROM lab_sessions WHERE user_id = $1 AND lab_id = $2 AND status = $3',
      [userId, id, 'active']
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'No active session found for this lab' });
    }

    const session = sessionResult.rows[0];

    // Update session to completed
    const updateQuery = `
      UPDATE lab_sessions 
      SET status = $1, ended_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(updateQuery, ['completed', session.id]);

    res.json({
      success: true,
      message: 'Lab session stopped successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error stopping lab session:', error);
    res.status(500).json({ 
      error: 'Failed to stop lab session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
