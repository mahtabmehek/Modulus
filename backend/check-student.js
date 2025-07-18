const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'modulus',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function checkStudentUser() {
  try {
    console.log('🔍 Checking student user in database...');

    const result = await pool.query('SELECT id, email, password_hash, name, role, course_code, course_id FROM users WHERE email = $1', ['student@test.com']);
    
    if (result.rows.length === 0) {
      console.log('❌ No student user found with email: student@test.com');
      
      // Check for other student users
      const allStudents = await pool.query('SELECT id, email, name, role, course_code FROM users WHERE role = $1', ['student']);
      console.log('Available student users:');
      allStudents.rows.forEach(student => {
        console.log(`- ${student.email} (ID: ${student.id}, Course: ${student.course_code})`);
      });
    } else {
      const student = result.rows[0];
      console.log('✅ Student user found:');
      console.log(`ID: ${student.id}`);
      console.log(`Email: ${student.email}`);
      console.log(`Name: ${student.name}`);
      console.log(`Role: ${student.role}`);
      console.log(`Course Code: ${student.course_code}`);
      console.log(`Course ID: ${student.course_id}`);
      console.log(`Password hash: ${student.password_hash}`);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

checkStudentUser();
