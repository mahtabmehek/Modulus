const { pool } = require('./backend/db');

(async () => {
    try {
        // Check courses table columns
        const coursesColumnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'courses'
      ORDER BY ordinal_position
    `);
        console.log('Courses table columns:', coursesColumnsResult.rows.map(r => r.column_name));

        // Check all courses
        const allCoursesResult = await pool.query(`
      SELECT * 
      FROM courses 
      ORDER BY id
    `);
        console.log('All courses:', allCoursesResult.rows);

        // Check student3's course_code vs available courses
        const student3Result = await pool.query(`
      SELECT course_code, course_id 
      FROM users 
      WHERE email = 'student3@test.com'
    `);
        console.log('Student3 course info:', student3Result.rows);

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
    }
})();
