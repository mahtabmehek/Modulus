const { pool } = require('./backend/db.js');

async function checkCoursesSchema() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'courses' 
            ORDER BY ordinal_position;
        `);
        
        console.log('Courses table schema:');
        console.table(result.rows);
        
        const requiredFields = result.rows.filter(col => col.is_nullable === 'NO' && !col.column_default);
        console.log('\nRequired fields (not nullable, no default):');
        console.table(requiredFields);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkCoursesSchema();
