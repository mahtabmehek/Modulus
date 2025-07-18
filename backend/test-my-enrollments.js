const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'modulus-lms-secret-key-change-in-production';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'modulus',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function testMyEnrollments() {
  try {
    console.log('🧪 Testing my-enrollments logic...');

    // First login to get a real token
    const bcrypt = require('bcryptjs');
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', ['student@test.com']);
    const user = userResult.rows[0];

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    // Create a real JWT token like the login endpoint does
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Generated token for user:', user.email);

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Decoded token:', decoded);

    // Now test the my-enrollments logic
    console.log('\n🔍 Testing my-enrollments logic...');

    // Get user's course code
    const courseCodeResult = await pool.query('SELECT course_code FROM users WHERE id = $1', [decoded.id]);
    const courseCode = courseCodeResult.rows[0]?.course_code;
    
    console.log('User course code:', courseCode);

    if (!courseCode) {
      console.log('❌ No course code assigned');
      return;
    }

    // Test the course query
    const courseQuery = `
      SELECT 
        c.id as course_id,
        c.title,
        c.code,
        c.description,
        c.department,
        c.academic_level,
        c.duration,
        c.total_credits,
        
        m.id as module_id,
        m.title as module_title,
        m.description as module_description,
        m.order_index as module_order,
        
        l.id as lab_id,
        l.title as lab_title,
        l.description as lab_description,
        l.difficulty,
        l.estimated_duration,
        l.order_index as lab_order,
        
        up.status as progress_status,
        up.completed_at,
        up.score
        
      FROM courses c
      LEFT JOIN modules m ON c.id = m.course_id AND m.is_published = true
      LEFT JOIN labs l ON m.id = l.module_id AND l.is_published = true
      LEFT JOIN user_progress up ON (up.user_id = $1 AND up.lab_id = l.id)
      
      WHERE c.code = $2 AND c.is_published = true
      
      ORDER BY m.order_index, l.order_index
      LIMIT 5
    `;

    const result = await pool.query(courseQuery, [decoded.id, courseCode]);
    console.log(`\n📊 Query returned ${result.rows.length} rows`);
    
    if (result.rows.length > 0) {
      console.log('Sample row:', result.rows[0]);
      console.log('✅ Query executed successfully');
    } else {
      console.log('❌ No data returned from query');
    }

    await pool.end();
    
  } catch (error) {
    console.error('❌ Error testing my-enrollments:', error);
    await pool.end();
  }
}

testMyEnrollments();
