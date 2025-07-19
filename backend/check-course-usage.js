const { pool } = require('./db');

async function checkCourseUsage() {
  try {
    const courses = await pool.query('SELECT id, title FROM courses ORDER BY id');
    
    console.log('Course usage analysis:');
    console.log('=====================');
    
    for (const course of courses.rows) {
      console.log(`\nCourse ${course.id}: "${course.title}"`);
      
      // Check modules
      const modules = await pool.query('SELECT COUNT(*) FROM modules WHERE course_id = $1', [course.id]);
      console.log(`  - Modules: ${modules.rows[0].count}`);
      
      // Check user_progress  
      const progress = await pool.query('SELECT COUNT(*) FROM user_progress WHERE course_id = $1', [course.id]);
      console.log(`  - User Progress: ${progress.rows[0].count}`);
      
      // Check announcements
      const announcements = await pool.query('SELECT COUNT(*) FROM announcements WHERE course_id = $1', [course.id]);
      console.log(`  - Announcements: ${announcements.rows[0].count}`);
      
      // Check users assigned to this course
      const users = await pool.query('SELECT COUNT(*) FROM users WHERE course_id = $1', [course.id]);
      console.log(`  - Assigned Users: ${users.rows[0].count}`);
      
      const totalRefs = parseInt(modules.rows[0].count) + parseInt(progress.rows[0].count) + 
                       parseInt(announcements.rows[0].count) + 
                       parseInt(users.rows[0].count);
      
      console.log(`  - Total References: ${totalRefs} ${totalRefs > 0 ? '❌ CANNOT DELETE' : '✅ CAN DELETE'}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkCourseUsage();
