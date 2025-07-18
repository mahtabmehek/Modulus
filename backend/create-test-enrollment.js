const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'modulus_lms',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function createTestEnrollment() {
  try {
    console.log('🎓 Creating test enrollment data...');

    // First, let's check what users and courses exist
    const usersResult = await pool.query(`
      SELECT id, email, role, name 
      FROM users 
      WHERE role = 'student' 
      ORDER BY id 
      LIMIT 5
    `);

    const coursesResult = await pool.query(`
      SELECT id, title, code 
      FROM courses 
      ORDER BY id 
      LIMIT 5
    `);

    console.log('📚 Available students:', usersResult.rows);
    console.log('📖 Available courses:', coursesResult.rows);

    if (usersResult.rows.length === 0) {
      console.log('❌ No students found in database');
      return;
    }

    if (coursesResult.rows.length === 0) {
      console.log('❌ No courses found in database');
      return;
    }

    // Get the first student and first course
    const student = usersResult.rows[0];
    const course = coursesResult.rows[0];

    console.log(`🎯 Enrolling student ${student.name} (${student.email}) in course ${course.code} - ${course.title}`);

    // Check if enrollment already exists
    const existingEnrollment = await pool.query(`
      SELECT id FROM enrollments 
      WHERE user_id = $1 AND course_id = $2
    `, [student.id, course.id]);

    if (existingEnrollment.rows.length > 0) {
      console.log('✅ Enrollment already exists!');
      return;
    }

    // Create the enrollment
    const enrollmentResult = await pool.query(`
      INSERT INTO enrollments (user_id, course_id, enrolled_at, status, completion_percentage)
      VALUES ($1, $2, NOW(), 'active', 0)
      RETURNING *
    `, [student.id, course.id]);

    console.log('✅ Enrollment created:', enrollmentResult.rows[0]);

    // Let's also check what modules are in this course
    const modulesResult = await pool.query(`
      SELECT id, title, description, order_index
      FROM modules 
      WHERE course_id = $1 
      ORDER BY order_index
    `, [course.id]);

    console.log('📋 Modules in this course:', modulesResult.rows);

    // Check labs in modules
    if (modulesResult.rows.length > 0) {
      const labsResult = await pool.query(`
        SELECT l.id, l.title, l.module_id, m.title as module_title
        FROM labs l
        JOIN modules m ON l.module_id = m.id
        WHERE m.course_id = $1
        ORDER BY m.order_index, l.order_index
      `, [course.id]);

      console.log('🧪 Labs in this course:', labsResult.rows);

      // Create some sample progress for the first few labs
      if (labsResult.rows.length > 0) {
        const lab1 = labsResult.rows[0];
        const lab2 = labsResult.rows[1];

        // Mark first lab as completed
        if (lab1) {
          await pool.query(`
            INSERT INTO user_progress (user_id, course_id, module_id, lab_id, status, completed_at, score)
            VALUES ($1, $2, $3, $4, 'completed', NOW(), 85)
            ON CONFLICT (user_id, course_id, module_id, lab_id) DO NOTHING
          `, [student.id, course.id, lab1.module_id, lab1.id]);
          console.log(`✅ Marked lab "${lab1.title}" as completed`);
        }

        // Mark second lab as in progress
        if (lab2) {
          await pool.query(`
            INSERT INTO user_progress (user_id, course_id, module_id, lab_id, status, started_at)
            VALUES ($1, $2, $3, $4, 'in_progress', NOW())
            ON CONFLICT (user_id, course_id, module_id, lab_id) DO NOTHING
          `, [student.id, course.id, lab2.module_id, lab2.id]);
          console.log(`✅ Marked lab "${lab2.title}" as in progress`);
        }
      }
    }

    console.log('🎉 Test enrollment data created successfully!');

  } catch (error) {
    console.error('❌ Error creating test enrollment:', error);
  } finally {
    await pool.end();
  }
}

createTestEnrollment();
