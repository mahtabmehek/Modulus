const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'modulus',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function checkCoursesAndTables() {
  try {
    console.log('🔍 Checking database tables and courses...');

    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('\n📊 Available tables:');
    tablesResult.rows.forEach(table => {
      console.log(`- ${table.table_name}`);
    });

    // Check courses
    try {
      const coursesResult = await pool.query('SELECT id, title, code, is_published FROM courses ORDER BY id');
      console.log('\n📚 Available courses:');
      if (coursesResult.rows.length === 0) {
        console.log('❌ No courses found in database');
      } else {
        coursesResult.rows.forEach(course => {
          console.log(`- ${course.code}: ${course.title} (Published: ${course.is_published})`);
        });
      }
    } catch (err) {
      console.log('❌ Courses table does not exist or error:', err.message);
    }

    // Check student user course assignment
    const studentResult = await pool.query('SELECT id, email, course_code FROM users WHERE email = $1', ['student@test.com']);
    if (studentResult.rows.length > 0) {
      const student = studentResult.rows[0];
      console.log(`\n👤 Student: ${student.email} assigned to course: ${student.course_code}`);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

checkCoursesAndTables();
