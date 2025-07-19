const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'modulus',
    user: 'postgres',
    password: 'mahtab',
});

async function checkIconPath() {
    try {
        // Check recent labs with icon paths
        const result = await pool.query(`
            SELECT id, title, icon_path, icon_url 
            FROM labs 
            ORDER BY updated_at DESC 
            LIMIT 5
        `);

        console.log('📋 Recent labs with icon data:');
        console.table(result.rows);

        // Check if files exist for these paths
        const fs = require('fs');
        const path = require('path');

        for (const lab of result.rows) {
            if (lab.icon_path) {
                const fullPath = path.join(__dirname, '..', lab.icon_path);
                const exists = fs.existsSync(fullPath);
                console.log(`🔍 Lab "${lab.title}": icon_path="${lab.icon_path}" - File exists: ${exists}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkIconPath();
