const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'modulus_lms',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function addCourseCodeColumn() {
    try {
        console.log('🔧 Adding course_code column to users table...');

        // Check if column already exists
        const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'course_code'
    `);

        if (columnCheck.rows.length > 0) {
            console.log('✅ course_code column already exists');
        } else {
            // Add the column
            await pool.query(`
        ALTER TABLE users 
        ADD COLUMN course_code VARCHAR(50)
      `);
            console.log('✅ course_code column added successfully');
        }

        // Now assign a test course code to a student
        const students = await pool.query(`
      SELECT id, email, name 
      FROM users 
      WHERE role = 'student' 
      ORDER BY id 
      LIMIT 3
    `);

        console.log('📚 Available students:', students.rows);

        if (students.rows.length > 0) {
            const student = students.rows[0];

            // Assign CS-401 course code to the first student
            await pool.query(`
        UPDATE users 
        SET course_code = 'CS-401' 
        WHERE id = $1
      `, [student.id]);

            console.log(`✅ Assigned course code CS-401 to student: ${student.name} (${student.email})`);

            // Check the assignment worked
            const updatedUser = await pool.query(`
        SELECT id, name, email, course_code 
        FROM users 
        WHERE id = $1
      `, [student.id]);

            console.log('✅ Updated user:', updatedUser.rows[0]);
        }

        console.log('🎉 Course code migration completed successfully!');

    } catch (error) {
        console.error('❌ Error in course code migration:', error);
    } finally {
        await pool.end();
    }
}

addCourseCodeColumn();
