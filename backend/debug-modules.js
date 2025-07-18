const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'modulus',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'mahtab'
});

async function checkModulesAndCourses() {
  try {
    console.log('=== CHECKING COURSES ===');
    const coursesResult = await pool.query('SELECT * FROM courses ORDER BY id');
    console.log('Courses found:');
    coursesResult.rows.forEach(course => {
      console.log(`- ID: ${course.id}, Title: "${course.title}", Code: "${course.code}"`);
    });

    console.log('\n=== CHECKING MODULES ===');
    const modulesResult = await pool.query(`
      SELECT m.*, c.title as course_title, c.code as course_code 
      FROM modules m 
      LEFT JOIN courses c ON m.course_id = c.id 
      ORDER BY m.course_id, m.id
    `);
    
    if (modulesResult.rows.length === 0) {
      console.log('No modules found in database!');
    } else {
      console.log('Modules found:');
      modulesResult.rows.forEach(module => {
        console.log(`- Module ID: ${module.id}, Title: "${module.title}"`);
        console.log(`  Course ID: ${module.course_id}, Course: "${module.course_title}" (${module.course_code})`);
        console.log(`  Published: ${module.is_published}, Order: ${module.order_index}`);
        console.log('');
      });
    }

    console.log('\n=== CHECKING LABS ===');
    const labsResult = await pool.query(`
      SELECT l.*, m.title as module_title, c.title as course_title 
      FROM labs l 
      LEFT JOIN modules m ON l.module_id = m.id 
      LEFT JOIN courses c ON m.course_id = c.id 
      ORDER BY l.module_id, l.id
    `);
    
    if (labsResult.rows.length === 0) {
      console.log('No labs found in database!');
    } else {
      console.log('Labs found:');
      labsResult.rows.forEach(lab => {
        console.log(`- Lab ID: ${lab.id}, Title: "${lab.title}"`);
        console.log(`  Module: "${lab.module_title}", Course: "${lab.course_title}"`);
        console.log(`  Published: ${lab.is_published}, Type: ${lab.lab_type}`);
        console.log('');
      });
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

checkModulesAndCourses();
