const { pool } = require('./db');

async function checkCourseSaveStatus() {
  try {
    console.log('🔍 Checking course save status...');
    
    // Check modules for course 14 (WHZ_6)
    const modules = await pool.query(`
      SELECT m.id, m.title, m.order_index, m.updated_at 
      FROM modules m 
      WHERE m.course_id = 14 
      ORDER BY m.order_index
    `);
    
    console.log('\n📖 Current modules in course WHZ_6:');
    modules.rows.forEach(module => {
      console.log(`  - Module ${module.id}: "${module.title}" (order: ${module.order_index}, updated: ${module.updated_at})`);
    });
    
    // Check module_labs relationships
    const moduleLabsRels = await pool.query(`
      SELECT ml.*, m.title as module_title, l.title as lab_title
      FROM module_labs ml
      JOIN modules m ON ml.module_id = m.id
      JOIN labs l ON ml.lab_id = l.id
      WHERE m.course_id = 14
      ORDER BY ml.module_id, ml.order_index
    `);
    
    console.log('\n🔗 Module-Lab relationships:');
    if (moduleLabsRels.rows.length === 0) {
      console.log('  (No relationships found)');
    } else {
      moduleLabsRels.rows.forEach(rel => {
        console.log(`  - ${rel.module_title} <-> ${rel.lab_title} (order: ${rel.order_index})`);
      });
    }
    
    // Check last save time
    const course = await pool.query('SELECT updated_at FROM courses WHERE id = 14');
    console.log('\n📅 Course last updated:', course.rows[0]?.updated_at);
    
    // Count total relationships
    const totalRels = await pool.query('SELECT COUNT(*) FROM module_labs');
    console.log('🔢 Total module-lab relationships in system:', totalRels.rows[0].count);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

checkCourseSaveStatus();
