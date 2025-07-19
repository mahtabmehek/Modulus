const { pool } = require('./backend/db');

(async () => {
  try {
    // First, check all users with course_code but missing course_id
    const missingCoursesResult = await pool.query(`
      SELECT u.id, u.name, u.email, u.course_code 
      FROM users u
      WHERE u.course_code IS NOT NULL AND u.course_id IS NULL
    `);
    
    console.log('Users with missing course_id:', missingCoursesResult.rows);

    // Update all users to have the correct course_id based on their course_code
    const updateResult = await pool.query(`
      UPDATE users 
      SET course_id = c.id
      FROM courses c
      WHERE users.course_code = c.code 
      AND users.course_id IS NULL
    `);
    
    console.log('Update result:', updateResult.rowCount, 'rows updated');

    // Verify all updates
    const verifyResult = await pool.query(`
      SELECT u.id, u.name, u.email, u.course_code, u.course_id, c.title 
      FROM users u
      LEFT JOIN courses c ON u.course_id = c.id
      WHERE u.course_code IS NOT NULL
      ORDER BY u.id
    `);
    
    console.log('All students with courses after update:');
    verifyResult.rows.forEach(row => {
      console.log(`- ${row.name} (${row.email}): ${row.course_code} -> "${row.title}"`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();
