const { pool } = require('./backend/db.js');

async function checkLabsSchema() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'labs' 
            ORDER BY ordinal_position;
        `);

        console.log('Labs table schema:');
        console.table(result.rows);

        // Check specifically for module_id
        const moduleIdColumn = result.rows.find(col => col.column_name === 'module_id');
        if (moduleIdColumn) {
            console.log('\nModule ID column details:');
            console.log('- Nullable:', moduleIdColumn.is_nullable);
            console.log('- Data type:', moduleIdColumn.data_type);
            console.log('- Default:', moduleIdColumn.column_default);

            if (moduleIdColumn.is_nullable === 'NO') {
                console.log('\n⚠️  WARNING: module_id column does not allow NULL values!');
                console.log('   We need to modify the schema to allow NULL values.');
            } else {
                console.log('\n✅ Module ID column allows NULL values - good to go!');
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkLabsSchema();
