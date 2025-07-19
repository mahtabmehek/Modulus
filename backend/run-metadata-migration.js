// Migration script to add metadata columns - matches your server.js configuration
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'modulus',      // Matches your server.js
    user: process.env.DB_USER || 'postgres',         // Matches your server.js  
    password: process.env.DB_PASSWORD || 'postgres', // Matches your server.js
    ssl: false
});

async function runMigration() {
    try {
        console.log('🔄 Starting metadata columns migration...');

        const sqlPath = path.join(__dirname, '..', 'database', 'migrations', 'add-metadata-columns.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);
        console.log('✅ Metadata columns migration completed successfully');
        console.log('📊 Added metadata JSONB columns to tasks and questions tables');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Make sure PostgreSQL is running and accessible');
        } else if (error.code === '28P01') {
            console.error('💡 Authentication failed - check your DB_PASSWORD');
        } else if (error.code === '3D000') {
            console.error('💡 Database does not exist - check your DB_NAME');
        }

    } finally {
        await pool.end();
    }
}

runMigration();
