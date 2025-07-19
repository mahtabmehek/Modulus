const { pool } = require('./db');

async function fixLabModuleIds() {
  try {
    console.log('🔧 Fixing lab module_id references...');
    
    // Check labs with module_id set
    const labsWithModuleId = await pool.query('SELECT id, title, module_id FROM labs WHERE module_id IS NOT NULL');
    console.log('\n📚 Labs with direct module_id:');
    labsWithModuleId.rows.forEach(lab => {
      console.log(`  - Lab ${lab.id}: "${lab.title}" -> module_id: ${lab.module_id}`);
    });
    
    // Clear all module_id references since we're using many-to-many now
    const result = await pool.query('UPDATE labs SET module_id = NULL WHERE module_id IS NOT NULL');
    console.log(`\n✅ Cleared module_id from ${result.rowCount} labs`);
    
    // Verify the change
    const remainingDirectRefs = await pool.query('SELECT COUNT(*) FROM labs WHERE module_id IS NOT NULL');
    console.log(`📊 Remaining direct module_id references: ${remainingDirectRefs.rows[0].count}`);
    
    console.log('\n🎉 Labs now use only many-to-many relationships via module_labs table');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

fixLabModuleIds();
