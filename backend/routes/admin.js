const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

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

// Admin endpoint to create test users
// This should only be used in development/testing
router.post('/create-test-users', async (req, res) => {
  try {
    // Check if we're in production and have the right access code
    const { accessCode } = req.body;
    if (accessCode !== 'mahtabmehek1337') {
      return res.status(403).json({ error: 'Invalid access code' });
    }

    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Password for all test users (except staffuser@test.com)
    const password = 'Mahtabmehek@1337';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Special password for staffuser@test.com
    const staffPassword = 'password123';
    const staffPasswordHash = await bcrypt.hash(staffPassword, saltRounds);

    // Test users to create with specific IDs
    const testUsers = [
      { id: 1001, email: 'student@test.com', name: 'Test Student', role: 'student', level: 1, level_name: 'Beginner', total_points: 0 },
      { id: 501, email: 'instructor@test.com', name: 'Test Instructor', role: 'instructor', level: 5, level_name: 'Advanced', total_points: 500 },
      { id: 101, email: 'staff@test.com', name: 'Test Staff', role: 'staff', level: 7, level_name: 'Professional', total_points: 750 },
      { id: 103, email: 'staffuser@test.com', name: 'Staff User', role: 'staff', level: 7, level_name: 'Professional', total_points: 750 },
      { id: 1, email: 'admin@test.com', name: 'Test Admin', role: 'admin', level: 10, level_name: 'Expert', total_points: 1000 },
      { id: 1002, email: 'student@modulus.com', name: 'Modulus Student', role: 'student', level: 1, level_name: 'Beginner', total_points: 0 },
      { id: 502, email: 'instructor@modulus.com', name: 'Modulus Instructor', role: 'instructor', level: 5, level_name: 'Advanced', total_points: 500 },
      { id: 102, email: 'staff@modulus.com', name: 'Modulus Staff', role: 'staff', level: 7, level_name: 'Professional', total_points: 750 },
      { id: 2, email: 'admin@modulus.com', name: 'Modulus Admin', role: 'admin', level: 10, level_name: 'Expert', total_points: 1000 }
    ];

    // First, delete existing test users
    const deleteQuery = `
      DELETE FROM users 
      WHERE email IN ('student@test.com', 'instructor@test.com', 'staff@test.com', 'staffuser@test.com', 'admin@test.com', 
                      'student@modulus.com', 'instructor@modulus.com', 'staff@modulus.com', 'admin@modulus.com')
    `;
    await db.query(deleteQuery);

    // Insert new test users with specific IDs
    const insertQuery = `
      INSERT INTO users (id, email, password_hash, name, role, is_approved, created_at, last_active, level, level_name, total_points)
      VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW(), $6, $7, $8)
    `;

    const results = [];
    for (const user of testUsers) {
      try {
        // Use special password for staffuser@test.com
        const userPasswordHash = user.email === 'staffuser@test.com' ? staffPasswordHash : passwordHash;
        
        const result = await db.query(insertQuery, [
          user.id,
          user.email,
          userPasswordHash,
          user.name,
          user.role,
          user.level,
          user.level_name,
          user.total_points
        ]);
        results.push({ id: user.id, email: user.email, status: 'created' });
      } catch (error) {
        results.push({ id: user.id, email: user.email, status: 'error', error: error.message });
      }
    }

    // Verify the users were created
    const verifyQuery = `
      SELECT id, email, name, role, is_approved, created_at 
      FROM users 
      WHERE email LIKE '%@test.com' OR email LIKE '%@modulus.com' 
      ORDER BY role, email
    `;
    const verifyResult = await db.query(verifyQuery);

    // Update the PostgreSQL sequence to prevent conflicts
    await updateUserIdSequence(db);

    res.json({
      message: 'Test users creation completed',
      password: password,
      results: results,
      created_users: verifyResult.rows,
      total_created: verifyResult.rows.length
    });

  } catch (error) {
    console.error('Error creating test users:', error);
    res.status(500).json({
      error: 'Failed to create test users',
      details: error.message
    });
  }
});

// Admin endpoint to verify test users
router.get('/test-users', async (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const query = `
      SELECT id, email, name, role, is_approved, created_at
      FROM users 
      WHERE email LIKE '%@test.com' OR email LIKE '%@modulus.com' 
      ORDER BY role, email
    `;
    const result = await db.query(query);

    res.json({
      message: 'Test users found',
      users: result.rows,
      total: result.rows.length,
      password_hint: 'Mahtabmehek@1337'
    });

  } catch (error) {
    console.error('Error fetching test users:', error);
    res.status(500).json({
      error: 'Failed to fetch test users',
      details: error.message
    });
  }
});

// Simple seed endpoint for easier access
router.get('/seed', async (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Password for all test users
    const password = 'Mahtabmehek@1337';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Test users to create
    const testUsers = [
      { email: 'student@test.com', name: 'Test Student', role: 'student', level: 1, level_name: 'Beginner', total_points: 0 },
      { email: 'instructor@test.com', name: 'Test Instructor', role: 'instructor', level: 5, level_name: 'Advanced', total_points: 500 },
      { email: 'admin@test.com', name: 'Test Admin', role: 'admin', level: 10, level_name: 'Expert', total_points: 1000 },
      { email: 'student', name: 'Simple Student', role: 'student', level: 1, level_name: 'Beginner', total_points: 0 },
      { email: 'instructor', name: 'Simple Instructor', role: 'instructor', level: 5, level_name: 'Advanced', total_points: 500 },
      { email: 'admin', name: 'Simple Admin', role: 'admin', level: 10, level_name: 'Expert', total_points: 1000 }
    ];

    // Create users table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
        is_approved BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        level INTEGER DEFAULT 1,
        level_name VARCHAR(50) DEFAULT 'Beginner',
        total_points INTEGER DEFAULT 0
      );
    `;

    await db.query(createTableQuery);

    // Insert test users
    const insertQuery = `
      INSERT INTO users (email, name, password_hash, role, is_approved, level, level_name, total_points)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = $3,
        role = $4,
        is_approved = $5,
        level = $6,
        level_name = $7,
        total_points = $8
      RETURNING id, email, name, role;
    `;

    const insertedUsers = [];
    for (const user of testUsers) {
      const result = await db.query(insertQuery, [
        user.email,
        user.name,
        passwordHash,
        user.role,
        true,
        user.level,
        user.level_name,
        user.total_points
      ]);
      insertedUsers.push(result.rows[0]);
    }

    res.json({
      message: 'Test users seeded successfully',
      users: insertedUsers,
      total: insertedUsers.length,
      password: password
    });

  } catch (error) {
    console.error('Error seeding test users:', error);
    res.status(500).json({
      error: 'Failed to seed test users',
      details: error.message
    });
  }
});

// Admin endpoint to create basic database tables
router.post('/init-database', async (req, res) => {
  try {
    // Check if we have the right access code
    const { accessCode } = req.body;
    if (accessCode !== 'mahtabmehek1337') {
      return res.status(403).json({ error: 'Invalid access code' });
    }

    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Create users table - simplified version first
    const createUsersQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'staff', 'admin')),
        is_approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await db.query(createUsersQuery);

    // Add missing columns if they don't exist
    const alterQueries = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS level_name VARCHAR(100) DEFAULT \'Beginner\'',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT \'{}\'',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0'
    ];

    for (const query of alterQueries) {
      try {
        await db.query(query);
      } catch (error) {
        console.log(`Column might already exist: ${error.message}`);
      }
    }

    res.json({
      message: 'Database tables created successfully',
      tables: ['users']
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ error: 'Database initialization failed', details: error.message });
  }
});

// Admin endpoint to reset user passwords
router.post('/reset-password', async (req, res) => {
  try {
    const { accessCode, email, newPassword } = req.body;

    // Check admin access
    if (accessCode !== 'mahtabmehek1337') {
      return res.status(403).json({ error: 'Invalid access code' });
    }

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Hash the new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    const updateQuery = 'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email, name, role';
    const result = await db.query(updateQuery, [newPasswordHash, email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Password reset successfully',
      user: result.rows[0],
      newPassword: newPassword
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed', details: error.message });
  }
});

// Admin endpoint to list all users
router.get('/list-users', async (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const query = 'SELECT id, email, name, role, is_approved, created_at FROM users ORDER BY id';
    const result = await db.query(query);

    res.json({
      users: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to list users', details: error.message });
  }
});

// Admin endpoint to create a single user manually
router.post('/create-user', async (req, res) => {
  try {
    const { email, name, role, password, accessCode } = req.body;

    // Verify admin access
    if (accessCode !== 'mahtabmehek1337') {
      return res.status(403).json({ error: 'Invalid access code' });
    }

    // Validate required fields
    if (!email || !name || !role || !password) {
      return res.status(400).json({
        error: 'All fields required: email, name, role, password'
      });
    }

    // Validate role
    if (!['student', 'instructor', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be: student, instructor, staff, or admin'
      });
    }

    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Generate role-based user ID
    const userId = await generateRoleBasedUserId(role, db);

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user with specific ID
    const isAutoApproved = (role === 'student' || role === 'admin');
    const result = await db.query(
      `INSERT INTO users (id, email, password_hash, name, role, is_approved, created_at, last_active, level, level_name, total_points, badges, streak_days)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8, $9, $10, $11)
       RETURNING id, email, name, role, is_approved, created_at`,
      [
        userId,
        email,
        passwordHash,
        name,
        role,
        isAutoApproved,
        role === 'student' ? 1 : (role === 'instructor' ? 5 : 10), // Default level
        role === 'student' ? 'Beginner' : (role === 'instructor' ? 'Advanced' : 'Expert'), // Default level name
        0, // total_points
        '[]', // badges (empty JSON array)
        0 // streak_days
      ]
    );

    const user = result.rows[0];

    // Update the PostgreSQL sequence to prevent conflicts
    await updateUserIdSequence(db);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.is_approved,
        createdAt: user.created_at
      },
      idRange: getIdRangeForRole(role)
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      error: 'Failed to create user',
      details: error.message
    });
  }
});

// Helper function to get ID range info for a role
function getIdRangeForRole(role) {
  switch (role) {
    case 'admin':
      return { min: 1, max: 99, description: 'Admin IDs: 1-99' };
    case 'staff':
      return { min: 100, max: 499, description: 'Staff IDs: 100-499' };
    case 'instructor':
      return { min: 500, max: 999, description: 'Instructor IDs: 500-999' };
    case 'student':
      return { min: 1000, max: 4999, description: 'Student IDs: 1000-4999' };
    default:
      return { min: 0, max: 0, description: 'Unknown role' };
  }
}

// Admin endpoint to get ID range information
router.get('/id-ranges', async (req, res) => {
  try {
    const { accessCode } = req.query;

    // Verify admin access
    if (accessCode !== 'mahtabmehek1337') {
      return res.status(403).json({ error: 'Invalid access code' });
    }

    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Get current user counts by role and ID ranges
    const countQuery = `
      SELECT 
        role,
        COUNT(*) as total_users,
        MIN(id) as lowest_id,
        MAX(id) as highest_id
      FROM users 
      GROUP BY role
      ORDER BY role
    `;

    const countResult = await db.query(countQuery);

    const ranges = {
      admin: { min: 1, max: 99, description: 'Admin IDs: 1-99' },
      staff: { min: 100, max: 499, description: 'Staff IDs: 100-499' },
      instructor: { min: 500, max: 999, description: 'Instructor IDs: 500-999' },
      student: { min: 1000, max: 4999, description: 'Student IDs: 1000-4999' }
    };

    // Add current usage to each range
    countResult.rows.forEach(row => {
      if (ranges[row.role]) {
        ranges[row.role].currentUsers = parseInt(row.total_users);
        ranges[row.role].lowestUsedId = parseInt(row.lowest_id);
        ranges[row.role].highestUsedId = parseInt(row.highest_id);
      }
    });

    res.json({
      message: 'User ID ranges and current usage',
      ranges: ranges,
      currentUsage: countResult.rows
    });

  } catch (error) {
    console.error('Error getting ID ranges:', error);
    res.status(500).json({
      error: 'Failed to get ID ranges',
      details: error.message
    });
  }
});

// Admin endpoint to migrate existing users to role-based ID ranges
router.post('/migrate-user-ids', async (req, res) => {
  try {
    const { accessCode, dryRun = true } = req.body;

    // Verify admin access
    if (accessCode !== 'mahtabmehek1337') {
      return res.status(403).json({ error: 'Invalid access code' });
    }

    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Get all users that need migration
    const usersQuery = `
      SELECT id, email, name, role
      FROM users 
      WHERE 
        (role = 'admin' AND (id < 1 OR id > 99)) OR
        (role = 'staff' AND (id < 100 OR id > 499)) OR
        (role = 'instructor' AND (id < 500 OR id > 999)) OR
        (role = 'student' AND (id < 1000 OR id > 4999))
      ORDER BY role, id
    `;

    const usersResult = await db.query(usersQuery);
    const usersToMigrate = usersResult.rows;

    if (usersToMigrate.length === 0) {
      return res.json({
        message: 'All users already have correct role-based IDs',
        migrationsNeeded: 0,
        dryRun: dryRun
      });
    }

    const migrationPlan = [];
    const errors = [];

    // Create migration plan
    for (const user of usersToMigrate) {
      try {
        // Find next available ID in the correct range
        const newId = await generateRoleBasedUserId(user.role, db);
        migrationPlan.push({
          oldId: user.id,
          newId: newId,
          email: user.email,
          name: user.name,
          role: user.role
        });
      } catch (error) {
        errors.push({
          userId: user.id,
          email: user.email,
          role: user.role,
          error: error.message
        });
      }
    }

    // If dry run, just return the plan
    if (dryRun) {
      return res.json({
        message: 'Migration plan generated (dry run)',
        dryRun: true,
        usersToMigrate: usersToMigrate.length,
        migrationPlan: migrationPlan,
        errors: errors,
        note: 'Set dryRun=false to execute the migration'
      });
    }

    // Execute migration if not dry run
    await db.query('BEGIN');

    try {
      const migrationResults = [];

      // Create temporary mapping table
      await db.query(`
        CREATE TEMPORARY TABLE temp_id_mapping (
          old_id INTEGER,
          new_id INTEGER,
          email VARCHAR(255)
        )
      `);

      // Step 1: Create new records with new IDs
      for (const migration of migrationPlan) {
        // Insert temporary mapping
        await db.query(
          'INSERT INTO temp_id_mapping (old_id, new_id, email) VALUES ($1, $2, $3)',
          [migration.oldId, migration.newId, migration.email]
        );

        // Create new user record with new ID (safer than updating existing ID)
        const insertResult = await db.query(`
          INSERT INTO users (id, email, password_hash, name, role, is_approved, created_at, last_active, level, level_name, total_points, badges, streak_days, department)
          SELECT $1, email, password_hash, name, role, is_approved, created_at, last_active, 
                 COALESCE(level, 1), COALESCE(level_name, 'Beginner'), COALESCE(total_points, 0), 
                 COALESCE(badges, '[]'), COALESCE(streak_days, 0), department
          FROM users WHERE id = $2 AND email = $3
        `, [migration.newId, migration.oldId, migration.email]);

        migrationResults.push({
          ...migration,
          success: insertResult.rowCount === 1,
          action: 'created_new_record'
        });
      }

      // Step 2: Delete old records (only if all new records were created successfully)
      const allSuccessful = migrationResults.every(r => r.success);
      if (allSuccessful) {
        for (const migration of migrationPlan) {
          await db.query(
            'DELETE FROM users WHERE id = $1 AND email = $2',
            [migration.oldId, migration.email]
          );
        }
      } else {
        throw new Error('Some migrations failed, rolling back');
      }

      // Update sequence after migration
      await updateUserIdSequence(db);

      await db.query('COMMIT');

      res.json({
        message: 'User ID migration completed successfully',
        dryRun: false,
        totalMigrated: migrationResults.filter(r => r.success).length,
        migrationResults: migrationResults,
        errors: errors
      });

    } catch (migrationError) {
      await db.query('ROLLBACK');
      throw migrationError;
    }

  } catch (error) {
    console.error('Error migrating user IDs:', error);
    res.status(500).json({
      error: 'Failed to migrate user IDs',
      details: error.message
    });
  }
});

// Admin endpoint to check current user ID distribution
router.get('/user-id-status', async (req, res) => {
  try {
    const { accessCode } = req.query;

    // Verify admin access
    if (accessCode !== 'mahtabmehek1337') {
      return res.status(403).json({ error: 'Invalid access code' });
    }

    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Check user distribution by role and ID ranges
    const statusQuery = `
      SELECT 
        role,
        COUNT(*) as total_users,
        MIN(id) as lowest_id,
        MAX(id) as highest_id,
        COUNT(CASE 
          WHEN role = 'admin' AND id BETWEEN 1 AND 99 THEN 1
          WHEN role = 'staff' AND id BETWEEN 100 AND 499 THEN 1
          WHEN role = 'instructor' AND id BETWEEN 500 AND 999 THEN 1
          WHEN role = 'student' AND id BETWEEN 1000 AND 4999 THEN 1
        END) as correct_range_count,
        COUNT(CASE 
          WHEN role = 'admin' AND (id < 1 OR id > 99) THEN 1
          WHEN role = 'staff' AND (id < 100 OR id > 499) THEN 1
          WHEN role = 'instructor' AND (id < 500 OR id > 999) THEN 1
          WHEN role = 'student' AND (id < 1000 OR id > 4999) THEN 1
        END) as wrong_range_count
      FROM users 
      GROUP BY role
      ORDER BY role
    `;

    const statusResult = await db.query(statusQuery);

    // Get specific users that need migration
    const migrationNeededQuery = `
      SELECT id, email, name, role,
        CASE 
          WHEN role = 'admin' THEN '1-99'
          WHEN role = 'staff' THEN '100-499'
          WHEN role = 'instructor' THEN '500-999'
          WHEN role = 'student' THEN '1000-4999'
        END as expected_range
      FROM users 
      WHERE 
        (role = 'admin' AND (id < 1 OR id > 99)) OR
        (role = 'staff' AND (id < 100 OR id > 499)) OR
        (role = 'instructor' AND (id < 500 OR id > 999)) OR
        (role = 'student' AND (id < 1000 OR id > 4999))
      ORDER BY role, id
    `;

    const migrationNeededResult = await db.query(migrationNeededQuery);

    const totalUsers = statusResult.rows.reduce((sum, row) => sum + parseInt(row.total_users), 0);
    const totalCorrect = statusResult.rows.reduce((sum, row) => sum + parseInt(row.correct_range_count), 0);
    const totalNeedMigration = statusResult.rows.reduce((sum, row) => sum + parseInt(row.wrong_range_count), 0);

    res.json({
      message: 'User ID status analysis',
      summary: {
        totalUsers: totalUsers,
        usersInCorrectRange: totalCorrect,
        usersNeedingMigration: totalNeedMigration,
        migrationComplete: totalNeedMigration === 0
      },
      roleBreakdown: statusResult.rows,
      usersNeedingMigration: migrationNeededResult.rows,
      idRanges: {
        admin: '1-99',
        staff: '100-499',
        instructor: '500-999',
        student: '1000-4999'
      }
    });

  } catch (error) {
    console.error('Error checking user ID status:', error);
    res.status(500).json({
      error: 'Failed to check user ID status',
      details: error.message
    });
  }
});

// Admin endpoint to approve a user
router.post('/approve-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Update user approval status
    const updateQuery = 'UPDATE users SET is_approved = true WHERE id = $1 RETURNING id, email, name, role, is_approved';
    const result = await db.query(updateQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      message: 'User approved successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.is_approved
      }
    });

  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({
      error: 'Failed to approve user',
      details: error.message
    });
  }
});

// Admin endpoint to reject/delete a user
router.delete('/reject-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // First get user info before deletion
    const getUserQuery = 'SELECT id, email, name, role FROM users WHERE id = $1';
    const userResult = await db.query(getUserQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Delete the user
    const deleteQuery = 'DELETE FROM users WHERE id = $1';
    await db.query(deleteQuery, [userId]);

    res.json({
      message: 'User rejected and deleted successfully',
      deletedUser: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({
      error: 'Failed to reject user',
      details: error.message
    });
  }
});

// Admin endpoint to get pending users (unapproved)
router.get('/pending-users', async (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const query = `
      SELECT id, email, name, role, is_approved, created_at
      FROM users 
      WHERE is_approved = false 
      ORDER BY created_at DESC
    `;
    const result = await db.query(query);

    res.json({
      message: 'Pending users retrieved successfully',
      users: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({
      error: 'Failed to fetch pending users',
      details: error.message
    });
  }
});

module.exports = router;
