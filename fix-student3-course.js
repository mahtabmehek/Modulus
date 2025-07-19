const { pool } = require('./backend/db');

(async () => {
    try {
        // Update student3 to have the correct course_id
        const updateResult = await pool.query(`
      UPDATE users 
      SET course_id = (
        SELECT id FROM courses WHERE code = $1
      )
      WHERE course_code = $1 AND course_id IS NULL
    `, ['WHZ_6']);

        console.log('Update result:', updateResult.rowCount, 'rows updated');

        // Verify the update
        const verifyResult = await pool.query(`
      SELECT u.id, u.name, u.email, u.course_code, u.course_id, c.title 
      FROM users u
      LEFT JOIN courses c ON u.course_id = c.id
      WHERE u.email = 'student3@test.com'
    `);

        console.log('Updated student3 info:', verifyResult.rows);

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
    }
})();
