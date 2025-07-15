const RDSDataClient = require('./rds-data-client');

async function checkTableStructure() {
    const db = new RDSDataClient();
    try {
        console.log('Checking users table structure...');
        const result = await db.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = $1 
            ORDER BY ordinal_position
        `, ['users']);
        
        console.log('Users table columns:');
        console.log('='.repeat(50));
        result.rows.forEach(col => {
            console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | Nullable: ${col.is_nullable}`);
        });
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkTableStructure();
