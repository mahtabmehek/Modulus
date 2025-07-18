const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'modulus',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function migrateToCourseId() {
  try {
    console.log('🔄 Migrating from course_code to course_id...');

    // Step 1: Add course_id column to users table
    try {
      await pool.query('ALTER TABLE users ADD COLUMN course_id INTEGER REFERENCES courses(id)');
      console.log('✅ Added course_id column to users table');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('ℹ️ course_id column already exists');
      } else {
        throw err;
      }
    }

    // Step 2: Get CS-402 course ID
    const courseResult = await pool.query('SELECT id FROM courses WHERE code = $1', ['CS-402']);
    if (courseResult.rows.length === 0) {
      console.log('❌ CS-402 course not found');
      return;
    }
    const courseId = courseResult.rows[0].id;
    console.log(`✅ Found CS-402 course with ID: ${courseId}`);

    // Step 3: Update student to use course_id instead of course_code
    await pool.query('UPDATE users SET course_id = $1 WHERE email = $2', [courseId, 'student@test.com']);
    console.log('✅ Updated student to use course_id');

    // Step 4: Verify the update
    const studentResult = await pool.query('SELECT id, email, course_code, course_id FROM users WHERE email = $1', ['student@test.com']);
    console.log('✅ Student after migration:', studentResult.rows[0]);

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

migrateToCourseId();
