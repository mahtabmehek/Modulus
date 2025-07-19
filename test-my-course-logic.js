const { pool } = require('./backend/db');

(async () => {
  try {
    // Test the my-course logic manually
    const userResult = await pool.query('SELECT course_code FROM users WHERE id = $1', [1002]); // student3
    console.log('Student3 course_code:', userResult.rows);
    
    if (userResult.rows[0] && userResult.rows[0].course_code) {
      const course_code = userResult.rows[0].course_code;
      
      const courseResult = await pool.query(`
        SELECT id, title, code, description, department, academic_level, duration, total_credits
        FROM courses WHERE code = $1
      `, [course_code]);
      
      console.log('Course found:', courseResult.rows);
      
      if (courseResult.rows.length > 0) {
        const course = courseResult.rows[0];
        
        const modulesResult = await pool.query(`
          SELECT id, title, description, order_index
          FROM modules WHERE course_id = $1
          ORDER BY order_index
        `, [course.id]);
        
        console.log('Modules found:', modulesResult.rows);
      }
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();
