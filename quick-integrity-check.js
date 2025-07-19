const { pool } = require('./backend/db.js');

async function quickIntegrityCheck() {
    try {
        console.log('🔍 Quick Database Integrity Check...\n');

        // Check all foreign key constraints
        const constraints = await pool.query(`
            SELECT 
                tc.table_name,
                tc.constraint_name,
                kcu.column_name,
                ccu.table_name AS foreign_table,
                ccu.column_name AS foreign_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            ORDER BY tc.table_name;
        `);

        console.log('📋 Foreign Key Constraints:');
        console.table(constraints.rows);

        // Check for any constraint violations
        console.log('\n🔍 Checking for violations...');
        
        // Check labs -> modules (old way)
        const labModuleViolations = await pool.query(`
            SELECT COUNT(*) as violations
            FROM labs l 
            WHERE l.module_id IS NOT NULL 
            AND l.module_id NOT IN (SELECT id FROM modules);
        `);

        // Check module_labs -> modules
        const junctionModuleViolations = await pool.query(`
            SELECT COUNT(*) as violations
            FROM module_labs ml 
            WHERE ml.module_id NOT IN (SELECT id FROM modules);
        `);

        // Check module_labs -> labs
        const junctionLabViolations = await pool.query(`
            SELECT COUNT(*) as violations
            FROM module_labs ml 
            WHERE ml.lab_id NOT IN (SELECT id FROM labs);
        `);

        console.log(`❌ Old labs.module_id violations: ${labModuleViolations.rows[0].violations}`);
        console.log(`❌ Junction module violations: ${junctionModuleViolations.rows[0].violations}`);
        console.log(`❌ Junction lab violations: ${junctionLabViolations.rows[0].violations}`);

        const totalViolations = parseInt(labModuleViolations.rows[0].violations) + 
                               parseInt(junctionModuleViolations.rows[0].violations) + 
                               parseInt(junctionLabViolations.rows[0].violations);

        if (totalViolations === 0) {
            console.log('\n✅ Database integrity is GOOD!');
        } else {
            console.log('\n⚠️ Found integrity issues!');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

quickIntegrityCheck();
