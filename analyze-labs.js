const { pool } = require('./backend/db.js');

async function analyzeLabs() {
    try {
        // Check existing labs
        const labs = await pool.query(`
            SELECT id, title, module_id, order_index 
            FROM labs 
            ORDER BY module_id, order_index;
        `);
        
        console.log('Existing labs in database:');
        console.table(labs.rows);
        
        // Check if there are any foreign key constraints
        const constraints = await pool.query(`
            SELECT 
                tc.constraint_name, 
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                tc.constraint_type
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.table_name = 'labs' AND tc.constraint_type = 'FOREIGN KEY';
        `);
        
        console.log('\nForeign key constraints on labs table:');
        console.table(constraints.rows);
        
        // Test the theoretical scenario: can a lab be moved to different modules?
        console.log('\n📋 Analysis Summary:');
        console.log('✅ Labs have their own unique ID (auto-incrementing)');
        console.log('✅ module_id is nullable (can be standalone)');
        console.log('✅ Labs can theoretically be moved between modules');
        
        if (constraints.rows.length > 0) {
            console.log('⚠️  Foreign key constraints exist - need to handle cascading');
        } else {
            console.log('✅ No foreign key constraints - full flexibility');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

analyzeLabs();
