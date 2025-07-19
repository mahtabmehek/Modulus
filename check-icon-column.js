const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/modulus_db'
});

async function checkSchema() {
    try {
        const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'labs' AND column_name LIKE '%icon%'
      ORDER BY ordinal_position
    `);
        console.log('Icon-related columns in labs table:');
        console.table(result.rows);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
