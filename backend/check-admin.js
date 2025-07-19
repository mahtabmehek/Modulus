const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'modulus',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function checkAdminUser() {
    try {
        console.log('🔍 Checking admin user in database...');

        const result = await pool.query('SELECT id, email, password_hash, name, role FROM users WHERE email = $1', ['admin@modulus.com']);

        if (result.rows.length === 0) {
            console.log('❌ No admin user found!');
        } else {
            const admin = result.rows[0];
            console.log('✅ Admin user found:');
            console.log(`ID: ${admin.id}`);
            console.log(`Email: ${admin.email}`);
            console.log(`Name: ${admin.name}`);
            console.log(`Role: ${admin.role}`);
            console.log(`Password hash: ${admin.password_hash}`);
        }

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
    }
}

checkAdminUser();
