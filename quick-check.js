const { pool } = require('./backend/db.js');

async function quickCheck() {
    try {
        // Check foreign keys
        const fk = await pool.query(`
            SELECT table_name, column_name, constraint_name 
            FROM information_schema.key_column_usage 
            WHERE constraint_name LIKE '%_fkey' 
            ORDER BY table_name;
        `);

        console.log('Foreign Keys:');
        console.table(fk.rows);

        // Quick data check
        const counts = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM courses) as courses,
                (SELECT COUNT(*) FROM modules) as modules, 
                (SELECT COUNT(*) FROM labs) as labs,
                (SELECT COUNT(*) FROM module_labs) as module_labs;
        `);

        console.log('\nTable Counts:');
        console.table(counts.rows);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

quickCheck();
