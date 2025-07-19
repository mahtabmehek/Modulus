const { pool } = require('./db');

async function addMoreLabs() {
  try {
    console.log('🔧 Adding more labs to modules...');
    
    // Add lab 122 to module 152 as well (if it exists)
    try {
      await pool.query(
        'INSERT INTO module_labs (module_id, lab_id, order_index) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [152, 122, 1]
      );
      console.log('✅ Added lab 122 to module 152');
    } catch (error) {
      console.log('❌ Failed to add lab 122:', error.message);
    }
    
    // Add lab 106 to second module as an example
    try {
      await pool.query(
        'INSERT INTO module_labs (module_id, lab_id, order_index) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [153, 106, 0]
      );
      console.log('✅ Added lab 106 to module 153');
    } catch (error) {
      console.log('❌ Failed to add lab 106 to module 153:', error.message);
    }
    
    // Check final state
    const finalRelations = await pool.query(`
      SELECT ml.*, m.title as module_title, l.title as lab_title 
      FROM module_labs ml 
      JOIN modules m ON ml.module_id = m.id 
      JOIN labs l ON ml.lab_id = l.id 
      ORDER BY ml.module_id, ml.order_index
    `);
    console.log('\n🎉 All module-labs relationships:');
    finalRelations.rows.forEach(rel => {
      console.log(`  - Module ${rel.module_id} (${rel.module_title}) <-> Lab ${rel.lab_id} (${rel.lab_title}) [order: ${rel.order_index}]`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

addMoreLabs();
