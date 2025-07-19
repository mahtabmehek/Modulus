const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'modulus',
    password: process.env.DB_PASSWORD || 'mahtab',
    port: process.env.DB_PORT || 5432,
});

async function testModuleAndLabs() {
    try {
        console.log('🔍 Checking all modules...');
        const modulesResult = await pool.query('SELECT id, title, course_id FROM modules ORDER BY id');
        console.log('Modules:', modulesResult.rows);

        console.log('\n🔍 Checking labs for module 7...');
        const labsResult = await pool.query('SELECT id, module_id, title, description, is_published, lab_type FROM labs WHERE module_id = 7');
        console.log('Labs for module 7:', labsResult.rows);

        console.log('\n🔍 Checking all labs...');
        const allLabsResult = await pool.query('SELECT id, module_id, title, is_published FROM labs ORDER BY module_id, order_index');
        console.log('All labs:', allLabsResult.rows);

        // Let's also create a test lab for module 7 if it doesn't exist
        if (labsResult.rows.length === 0) {
            console.log('\n✨ Creating test lab for module 7...');
            const insertResult = await pool.query(`
        INSERT INTO labs (module_id, title, description, order_index, is_published, estimated_minutes, points_possible, created_at, updated_at)
        VALUES (7, 'Test Lab for Module 7', 'This is a test lab for module 7', 1, true, 30, 100, NOW(), NOW())
        RETURNING *
      `);
            console.log('Created lab:', insertResult.rows[0]);
        }

        pool.end();
    } catch (error) {
        console.error('❌ Error:', error);
        pool.end();
    }
}

testModuleAndLabs();
