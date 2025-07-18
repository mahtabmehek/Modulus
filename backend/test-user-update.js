const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'modulus_lms',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function testUserUpdate() {
  try {
    console.log('🧪 Testing user update functionality...');

    // Test simple update
    const userId = 1002;
    const courseCode = 'CS-402';

    console.log(`Testing update for user ${userId} with course code: ${courseCode}`);

    // First get current user
    const currentUser = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    console.log('Current user:', currentUser.rows[0]);

    // Test the update (without updated_at)
    const updateResult = await pool.query(`
      UPDATE users 
      SET course_code = $1
      WHERE id = $2 
      RETURNING *
    `, [courseCode, userId]);

    console.log('✅ Update successful!');
    console.log('Updated user:', updateResult.rows[0]);

  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await pool.end();
  }
}

testUserUpdate();
