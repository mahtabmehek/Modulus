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

async function testSimplifiedEnrollments() {
  try {
    console.log('🧪 Testing simplified my-enrollments logic...');

    // Test for student user
    const userId = 1001; // student@test.com
    const courseCode = 'CS-402';

    console.log(`Testing for user ${userId} with course code: ${courseCode}`);

    // Step 1: Get the course
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
      WHERE code = $1 AND is_published = true
    `;

    const courseResult = await pool.query(courseQuery, [courseCode]);
    console.log('✅ Course query successful, found:', courseResult.rows.length, 'courses');
    
    if (courseResult.rows.length > 0) {
      console.log('Course:', courseResult.rows[0].title);
      
      // Step 2: Get modules
      const modulesQuery = `
        SELECT 
          id,
          title,
          description,
          order_index
        FROM modules 
        WHERE course_id = $1 AND is_published = true
        ORDER BY order_index
      `;

      const modulesResult = await pool.query(modulesQuery, [courseResult.rows[0].id]);
      console.log('✅ Modules query successful, found:', modulesResult.rows.length, 'modules');

      // Step 3: Get labs for first module
      if (modulesResult.rows.length > 0) {
        const firstModule = modulesResult.rows[0];
        console.log('First module:', firstModule.title);

        const labsQuery = `
          SELECT 
            id,
            title,
            description,
            order_index,
            estimated_minutes,
            points_possible
          FROM labs 
          WHERE module_id = $1 AND is_published = true
          ORDER BY order_index
        `;

        const labsResult = await pool.query(labsQuery, [firstModule.id]);
        console.log('✅ Labs query successful, found:', labsResult.rows.length, 'labs');
        
        if (labsResult.rows.length > 0) {
          console.log('First lab:', labsResult.rows[0].title);
        }
      }
    }

    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

testSimplifiedEnrollments();
