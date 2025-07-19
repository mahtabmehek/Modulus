const { pool } = require('./backend/db');

(async () => {
  try {
    // Check user ID for student3
    const userResult = await pool.query(`
      SELECT id, username, email, role, course_id 
      FROM users 
      WHERE username = 'student3'
    `);
    console.log('Student3 user info:', userResult.rows);

    if (userResult.rows.length > 0) {
      const student = userResult.rows[0];
      
      // Check if course exists
      if (student.course_id) {
        const courseResult = await pool.query(`
          SELECT id, title, description, created_at 
          FROM courses 
          WHERE id = $1
        `, [student.course_id]);
        console.log('Assigned course info:', courseResult.rows);
      } else {
        console.log('No course_id assigned to student3');
      }
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();
