const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'modulus',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: false
});

async function checkLabsTable() {
    try {
        console.log('Checking labs table structure...');
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = $1 
            ORDER BY ordinal_position
        `, ['labs']);
        
        console.log('Labs table columns:');
        console.log('='.repeat(50));
        result.rows.forEach(col => {
            console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | Nullable: ${col.is_nullable}`);
        });
        console.log('='.repeat(50));
        
        await pool.end();
        
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
    }
}

checkLabsTable();
