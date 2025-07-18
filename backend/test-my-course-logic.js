const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'modulus',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function testMyCourseLogic() {
  try {
    console.log('🧪 Testing my-course endpoint logic...');

    const userId = 1001;

    // Step 1: Get user's course_id
    const userResult = await pool.query('SELECT course_id FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    
    console.log('User course_id:', user?.course_id);

    if (!user || !user.course_id) {
      console.log('❌ No course_id assigned');
      return;
    }

    // Step 2: Get course by ID
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
      WHERE id = $1 AND is_published = true
    `;

    const courseResult = await pool.query(courseQuery, [user.course_id]);
    console.log('✅ Course found:', courseResult.rows[0]?.title);

    if (courseResult.rows.length === 0) {
      console.log('❌ Course not found');
      return;
    }

    // Step 3: Get modules
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

    const modulesResult = await pool.query(modulesQuery, [user.course_id]);
    console.log(`✅ Modules found: ${modulesResult.rows.length}`);

    console.log('✅ All queries successful - endpoint should work');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

testMyCourseLogic();
