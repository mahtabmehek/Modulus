const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'modulus',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: false
});

async function testUserWithCourse() {
    try {
        const query = `
      SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.role,
        u.course_id,
        c.code as "courseCode",
        c.title as "courseTitle"
      FROM users u
      LEFT JOIN courses c ON u.course_id = c.id
      WHERE u.email = $1
    `;

        const result = await pool.query(query, ['student@test.com']);

        console.log('=== STUDENT USER WITH COURSE INFO ===');
        console.log(JSON.stringify(result.rows[0], null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

testUserWithCourse();
