const { pool } = require('./backend/db');

(async () => {
    try {
        // Check if course with code WHZ_6 exists
        const courseResult = await pool.query(`
      SELECT id, title, description, course_code 
      FROM courses 
      WHERE course_code = 'WHZ_6'
    `);
        console.log('Course with code WHZ_6:', courseResult.rows);

        // Check all courses
        const allCoursesResult = await pool.query(`
      SELECT id, title, course_code 
      FROM courses 
      ORDER BY id
    `);
        console.log('All courses:', allCoursesResult.rows);

        // Check if there's a mismatch between course_code and course_id
        const usersWithCourseCodes = await pool.query(`
      SELECT id, name, email, course_code, course_id 
      FROM users 
      WHERE course_code IS NOT NULL
    `);
        console.log('Users with course codes:', usersWithCourseCodes.rows);

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
    }
})();
