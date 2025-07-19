const { pool } = require('./backend/db.js');

async function checkModules() {
    try {
        const modules = await pool.query(`
            SELECT id, title, course_id, order_index 
            FROM modules 
            ORDER BY course_id, order_index;
        `);
        
        console.log('Available modules in database:');
        console.table(modules.rows);
        
        if (modules.rows.length === 0) {
            console.log('\nNo modules found! This explains why lab creation is failing.');
            console.log('Labs need to be associated with existing modules.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkModules();
