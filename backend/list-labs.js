const { Pool } = require('pg');
const { pool } = require('./db');

async function listLabs() {
    try {
        const result = await pool.query('SELECT id, title FROM labs ORDER BY id');
        console.log('Available labs:');
        result.rows.forEach(lab => {
            console.log(`${lab.id}: ${lab.title}`);
        });
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

listLabs();
