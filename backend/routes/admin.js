const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Admin endpoint to create test users
// This should only be used in development/testing
router.post('/create-test-users', async (req, res) => {
  try {
    // Check if we're in production and have the right access code
    const { accessCode } = req.body;
    if (accessCode !== 'mahtabmehek1337') {
      return res.status(403).json({ error: 'Invalid access code' });
    }

    const pool = req.app.locals.pool;
    if (!pool) {
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
      { email: 'student@modulus.com', name: 'Modulus Student', role: 'student', level: 1, level_name: 'Beginner', total_points: 0 },
      { email: 'instructor@modulus.com', name: 'Modulus Instructor', role: 'instructor', level: 5, level_name: 'Advanced', total_points: 500 },
      { email: 'admin@modulus.com', name: 'Modulus Admin', role: 'admin', level: 10, level_name: 'Expert', total_points: 1000 }
    ];

    // First, delete existing test users
    const deleteQuery = `
      DELETE FROM users 
      WHERE email IN ('student@test.com', 'instructor@test.com', 'admin@test.com', 
                      'student@modulus.com', 'instructor@modulus.com', 'admin@modulus.com')
    `;
    await pool.query(deleteQuery);

    // Insert new test users
    const insertQuery = `
      INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active, level, level_name, total_points)
      VALUES ($1, $2, $3, $4, true, NOW(), NOW(), $5, $6, $7)
    `;

    const results = [];
    for (const user of testUsers) {
      try {
        const result = await pool.query(insertQuery, [
          user.email,
          passwordHash,
          user.name,
          user.role,
          user.level,
          user.level_name,
          user.total_points
        ]);
        results.push({ email: user.email, status: 'created' });
      } catch (error) {
        results.push({ email: user.email, status: 'error', error: error.message });
      }
    }

    // Verify the users were created
    const verifyQuery = `
      SELECT id, email, name, role, is_approved, created_at 
      FROM users 
      WHERE email LIKE '%@test.com' OR email LIKE '%@modulus.com' 
      ORDER BY role, email
    `;
    const verifyResult = await pool.query(verifyQuery);

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
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const query = `
      SELECT id, email, name, role, is_approved, created_at, last_active, level, total_points
      FROM users 
      WHERE email LIKE '%@test.com' OR email LIKE '%@modulus.com' 
      ORDER BY role, email
    `;
    const result = await pool.query(query);

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

module.exports = router;
