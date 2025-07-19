const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'modulus',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'mahtab'
});

async function checkSchema() {
    try {
        console.log('Checking labs table schema...');
        const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'labs' 
      ORDER BY ordinal_position
    `);

        console.log('\nLabs table columns:');
        result.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

        // Check specifically for tags and required_tools
        console.log('\nChecking tags and required_tools columns specifically:');
        const tagsResult = await pool.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'labs' AND column_name IN ('tags', 'required_tools')
    `);

        tagsResult.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type} (udt_name: ${row.udt_name})`);
        });

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
    }
}

checkSchema();
