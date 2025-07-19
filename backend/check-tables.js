const { pool } = require('./db');

async function checkTables() {
    try {
        // Check lab_completions structure
        const labCompletions = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'lab_completions'
            ORDER BY ordinal_position
        `);
        
        console.log('lab_completions table structure:');
        labCompletions.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
        
        // Check user_submissions structure
        const userSubmissions = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'user_submissions'
            ORDER BY ordinal_position
        `);
        
        console.log('\nuser_submissions table structure:');
        userSubmissions.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTables();
