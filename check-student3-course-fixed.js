const { pool } = require('./backend/db');

(async () => {
    try {
        // Check users table columns
        const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
        console.log('Users table columns:', columnsResult.rows.map(r => r.column_name));

        // Check user by email (as shown in the attachment)
        const userResult = await pool.query(`
      SELECT * 
      FROM users 
      WHERE email = 'student3@test.com'
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
