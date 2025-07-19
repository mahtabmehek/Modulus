const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const fs = require('fs').promises;
const path = require('path');
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

// GET /api/labs - Get all labs (with optional module filter)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { module_id } = req.query;
    const db = pool;

    let query = `
      SELECT DISTINCT l.*, m.title as module_title, m.course_id,
             COALESCE(ml.order_index, l.order_index) as effective_order
      FROM labs l
      LEFT JOIN modules m ON l.module_id = m.id
      LEFT JOIN module_labs ml ON l.id = ml.lab_id
    `;
    let params = [];

    if (module_id) {
      query += ' WHERE (l.module_id = $1 OR ml.module_id = $1)';
      params = [module_id];
    }

    query += ' ORDER BY effective_order ASC, l.created_at DESC';

    console.log('🔍 LABS QUERY DEBUG:');
    console.log('- Module ID filter:', module_id);
    console.log('- SQL Query:', query);
    console.log('- Parameters:', params);

    const result = await db.query(query, params);

    console.log('🔍 LABS RESULT DEBUG:');
    console.log('- Total labs found:', result.rows.length);
    console.log('- Lab titles:', result.rows.map(lab => `${lab.id}: ${lab.title}`));

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

// GET /api/labs/tags - Get all unique tags from existing labs
router.get('/tags', authenticateToken, async (req, res) => {
  try {
    const db = pool;

    const query = `
      SELECT DISTINCT unnest(tags) as tag 
      FROM labs 
      WHERE tags IS NOT NULL AND tags != '{}' 
      ORDER BY tag ASC
    `;

    const result = await db.query(query);
    const tags = result.rows.map(row => row.tag).filter(tag => tag && tag.trim());

    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      error: 'Failed to fetch tags',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/labs/:id - Get specific lab details with tasks and questions
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = pool;

    // Get lab details
    const labQuery = `
      SELECT l.*, m.title as module_title, m.course_id, c.title as course_title
      FROM labs l
      LEFT JOIN modules m ON l.module_id = m.id
      LEFT JOIN courses c ON m.course_id = c.id
      WHERE l.id = $1
    `;

    const labResult = await db.query(labQuery, [id]);

    if (labResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    const lab = labResult.rows[0];

    // Get tasks for this lab
    const tasksQuery = `
      SELECT id, title, description, order_index
      FROM tasks
      WHERE lab_id = $1
      ORDER BY order_index ASC
    `;

    console.log('🔍 DATABASE QUERY - Getting tasks for lab:', id);
    const tasksResult = await db.query(tasksQuery, [id]);
    const tasks = tasksResult.rows;
    console.log('🔍 DATABASE RESULT - Tasks retrieved from database:');
    console.log('  📋 Total tasks found:', tasks.length);
    tasks.forEach((t, i) => {
      console.log(`  📝 DB Task ${i}: ID=${t.id}, Title="${t.title}", Order=${t.order_index}`);
    });

    // Get questions for each task
    for (let task of tasks) {
      const questionsQuery = `
        SELECT id, type, title, description, expected_answer, points, order_index, 
               images, attachments, multiple_choice_options, hints, is_required
        FROM questions
        WHERE task_id = $1
        ORDER BY order_index ASC
      `;

      const questionsResult = await db.query(questionsQuery, [task.id]);
      task.questions = questionsResult.rows.map(q => ({
        id: q.id,
        type: q.type,
        title: q.title,
        description: q.description,
        flag: q.expected_answer,
        points: q.points || 0,
        images: q.images || [],
        attachments: q.attachments || [],
        multipleChoiceOptions: q.multiple_choice_options || undefined, // JSONB is already parsed
        hints: q.hints || [],
        isOptional: !q.is_required
      }));
    }

    // Add tasks to lab object
    lab.tasks = tasks;

    console.log('🔍 Final lab object tasks before sending to frontend:', lab.tasks.map(t => ({ id: t.id, title: t.title, order_index: t.order_index })));

    res.json({
      success: true,
      data: lab
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
    body('module_id').optional().isInt().withMessage('Module ID must be an integer if provided'),
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
    body('icon_url').optional().isLength({ max: 5000 }).withMessage('Icon URL too long'),
    body('tags').optional().isArray().withMessage('Tags must be an array')
  ],
  async (req, res) => {
    try {
      const db = pool;

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
        icon_url,
        tags,
        tasks // Add tasks to the expected fields
      } = req.body;

      // Verify module exists if module_id is provided
      if (module_id) {
        const moduleCheck = await db.query(
          'SELECT id FROM modules WHERE id = $1',
          [module_id]
        );

        if (moduleCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Module not found' });
        }
      }

      // Get next order index (for standalone labs, just use a simple counter)
      let finalOrderIndex;
      if (module_id) {
        const orderResult = await db.query(
          'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM labs WHERE module_id = $1',
          [module_id]
        );
        finalOrderIndex = orderResult.rows[0].next_order;
      } else {
        // For standalone labs, use a simple incremental order
        const orderResult = await db.query(
          'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM labs WHERE module_id IS NULL'
        );
        finalOrderIndex = orderResult.rows[0].next_order;
      }

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
          points_possible, estimated_minutes, order_index, icon_path, icon_url, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const values = [
        module_id || null, // Explicitly set to null if not provided
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
        icon_path || null,
        icon_url || null,
        tags || null // Pass array directly for PostgreSQL array type
      ];

      // Debug values array
      console.log('DEBUG VALUES ARRAY:');
      console.log('Values array:', values);
      console.log('lab_type value at index 3:', values[3]);

      const result = await db.query(query, values);
      const createdLab = result.rows[0];

      // Save tasks and questions if provided
      console.log('DEBUG: Received tasks data:', JSON.stringify(tasks, null, 2));
      if (tasks && Array.isArray(tasks) && tasks.length > 0) {
        for (let i = 0; i < tasks.length; i++) {
          const task = tasks[i];

          // Insert task
          const taskResult = await db.query(
            'INSERT INTO tasks (lab_id, title, description, order_index) VALUES ($1, $2, $3, $4) RETURNING id',
            [createdLab.id, task.title, task.description, i + 1]
          );
          const taskId = taskResult.rows[0].id;

          // Insert questions for this task
          if (task.questions && Array.isArray(task.questions)) {
            for (let j = 0; j < task.questions.length; j++) {
              const question = task.questions[j];

              await db.query(`
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
    body('icon_url').optional().isLength({ max: 5000 }).withMessage('Icon URL too long'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tasks').optional().isArray().withMessage('Tasks must be an array')
  ],
  async (req, res) => {
    try {
      const db = pool;

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
      const labCheck = await db.query('SELECT id FROM labs WHERE id = $1', [id]);
      if (labCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Lab not found' });
      }

      // Extract tasks for separate handling and remove from updates
      const { tasks, ...labUpdates } = updates;

      // Build dynamic update query for lab fields only
      const updateFields = [];
      const updateValues = [];
      let paramCounter = 1;

      // Valid lab table columns
      const validLabColumns = [
        'module_id', 'title', 'description', 'lab_type', 'vm_image',
        'container_image', 'required_tools', 'network_requirements',
        'points_possible', 'estimated_minutes', 'icon_path', 'icon_url', 'tags'
      ];

      Object.keys(labUpdates).forEach(key => {
        if (labUpdates[key] !== undefined && validLabColumns.includes(key)) {
          updateFields.push(`${key} = $${paramCounter}`);
          updateValues.push(labUpdates[key]);
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

      const result = await db.query(query, updateValues);

      // Handle tasks update if provided
      if (tasks && Array.isArray(tasks)) {
        console.log('💾 DATABASE UPDATE - Processing tasks:');
        console.log('  📋 Total tasks received:', tasks.length);
        tasks.forEach((t, i) => {
          console.log(`  📝 Frontend Task ${i}: ID=${t.id}, Title="${t.title}", Order=${t.order_index}`);
        });

        // Delete existing tasks and questions for this lab
        await db.query('DELETE FROM tasks WHERE lab_id = $1', [id]);

        // Insert new tasks and questions
        for (let i = 0; i < tasks.length; i++) {
          const task = tasks[i];
          // Use the order_index from the frontend instead of array position
          const taskOrderIndex = task.order_index || (i + 1);

          console.log(`💾 DATABASE INSERT - Task ${i}: Using order_index ${taskOrderIndex} for "${task.title}"`);

          // Insert task
          const taskResult = await db.query(
            'INSERT INTO tasks (lab_id, title, description, order_index) VALUES ($1, $2, $3, $4) RETURNING id',
            [id, task.title, task.description, taskOrderIndex]
          );
          const taskId = taskResult.rows[0].id;

          // Insert questions for this task
          if (task.questions && Array.isArray(task.questions)) {
            for (let j = 0; j < task.questions.length; j++) {
              const question = task.questions[j];

              await db.query(`
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
                question.order_index || (j + 1), // Use frontend order_index instead of array position
                question.images || null,
                question.attachments || null,
                question.multipleChoiceOptions ? JSON.stringify(question.multipleChoiceOptions) : null,
                question.hints || null
              ]);
            }
          }
        }
      }

      console.log('✅ DATABASE UPDATE COMPLETE - Lab and tasks saved to database');

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
    const db = pool;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    // Check if lab exists and get lab details
    const labCheck = await db.query('SELECT id, title FROM labs WHERE id = $1', [id]);
    if (labCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    const lab = labCheck.rows[0];

    // Check for active lab sessions
    const activeSessions = await db.query(
      'SELECT id FROM lab_sessions WHERE lab_id = $1 AND status = $2',
      [id, 'active']
    );

    if (activeSessions.rows.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete lab with active sessions',
        details: `${activeSessions.rows.length} active session(s) found`
      });
    }

    // Delete physical files for this lab
    try {
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'labs', id.toString());

      // Check if the directory exists
      try {
        await fs.access(uploadsDir);
        // Directory exists, delete it recursively
        await fs.rm(uploadsDir, { recursive: true, force: true });
        console.log(`Deleted lab files directory: ${uploadsDir}`);
      } catch (error) {
        // Directory doesn't exist or access error - this is okay, continue with database deletion
        console.log(`Lab files directory not found or already deleted: ${uploadsDir}`);
      }
    } catch (error) {
      console.error('Error deleting lab files:', error);
      // Don't fail the entire operation if file deletion fails
    }

    // Delete from database
    await db.query('DELETE FROM labs WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Lab and associated files deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lab:', error);
    res.status(500).json({
      error: 'Failed to delete lab',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/labs/:id/tasks/reorder - Reorder tasks
router.put('/:id/tasks/reorder',
  authenticateToken,
  requireStaffOrAdmin,
  async (req, res) => {
    try {
      const db = pool;
      const { id } = req.params;
      const { tasks } = req.body;

      console.log('🔄 Backend: Reordering tasks for lab:', id);
      console.log('🔄 Backend: Received tasks:', JSON.stringify(tasks, null, 2));

      if (!Array.isArray(tasks)) {
        console.error('❌ Backend: Tasks is not an array:', tasks);
        return res.status(400).json({ error: 'Tasks must be an array' });
      }

      // Start transaction
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        // Update each task's order_index
        for (const task of tasks) {
          console.log(`🔄 Backend: Updating task ${task.id} to order_index ${task.order_index}`);
          const result = await client.query(
            'UPDATE tasks SET order_index = $1 WHERE id = $2 AND lab_id = $3',
            [task.order_index, task.id, id]
          );
          console.log(`🔄 Backend: Updated ${result.rowCount} rows for task ${task.id}`);
        }

        await client.query('COMMIT');
        res.json({ message: 'Task order updated successfully' });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error reordering tasks:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/tasks/:id/questions/reorder - Reorder questions within a task
router.put('/tasks/:id/questions/reorder',
  authenticateToken,
  requireStaffOrAdmin,
  async (req, res) => {
    try {
      const db = pool;
      const { id } = req.params;
      const { questions } = req.body;

      console.log('🔄 Backend: Reordering questions for task:', id);
      console.log('🔄 Backend: Task ID type:', typeof id);
      console.log('🔄 Backend: Received questions:', JSON.stringify(questions, null, 2));

      if (!Array.isArray(questions)) {
        console.error('❌ Backend: Questions is not an array:', questions);
        return res.status(400).json({ error: 'Questions must be an array' });
      }

      // Validate question data
      for (const question of questions) {
        console.log(`🔄 Backend: Validating question ${question.id} (type: ${typeof question.id}) with order_index ${question.order_index} (type: ${typeof question.order_index})`);
        if (!question.id || !question.order_index) {
          console.error('❌ Backend: Invalid question data:', question);
          return res.status(400).json({ error: 'Each question must have id and order_index' });
        }
      }

      // Start transaction
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        // Update each question's order_index
        for (const question of questions) {
          console.log(`🔄 Backend: Updating question ${question.id} to order_index ${question.order_index}`);
          const result = await client.query(
            'UPDATE questions SET order_index = $1 WHERE id = $2 AND task_id = $3',
            [question.order_index, question.id, id]
          );
          console.log(`🔄 Backend: Updated ${result.rowCount} rows for question ${question.id}`);
        }

        await client.query('COMMIT');
        res.json({ message: 'Question order updated successfully' });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error reordering questions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/tasks/:id/metadata - Update task metadata
router.put('/tasks/:id/metadata',
  authenticateToken,
  requireStaffOrAdmin,
  async (req, res) => {
    try {
      const db = pool;
      const { id } = req.params;
      const { metadata } = req.body;

      if (!metadata || typeof metadata !== 'object') {
        return res.status(400).json({ error: 'Valid metadata object is required' });
      }

      // Update task metadata
      const result = await db.query(
        'UPDATE tasks SET metadata = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [JSON.stringify(metadata), id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({
        message: 'Task metadata updated successfully',
        task: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating task metadata:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/questions/:id/metadata - Update question metadata
router.put('/questions/:id/metadata',
  authenticateToken,
  requireStaffOrAdmin,
  async (req, res) => {
    try {
      const db = pool;
      const { id } = req.params;
      const { metadata } = req.body;

      if (!metadata || typeof metadata !== 'object') {
        return res.status(400).json({ error: 'Valid metadata object is required' });
      }

      // Update question metadata
      const result = await db.query(
        'UPDATE questions SET metadata = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [JSON.stringify(metadata), id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Question not found' });
      }

      res.json({
        message: 'Question metadata updated successfully',
        question: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating question metadata:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/labs/:id/sessions - Get lab sessions for a specific lab
router.get('/:id/sessions', authenticateToken, async (req, res) => {
  try {
    const db = pool;
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

    const result = await db.query(query, params);

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
    const db = pool;
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if lab exists
    const labResult = await db.query('SELECT * FROM labs WHERE id = $1', [id]);
    if (labResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    const lab = labResult.rows[0];

    // Check for existing active session for this user and lab
    const existingSession = await db.query(
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

    const sessionResult = await db.query(sessionQuery, sessionValues);

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
    const db = pool;
    const { id } = req.params;
    const userId = req.user.userId;

    // Find active session
    const sessionResult = await db.query(
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

    const result = await db.query(updateQuery, ['completed', session.id]);

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
