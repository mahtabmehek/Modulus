const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'modulus',
    user: 'postgres',
    password: 'mahtab',
});

async function testIconPath() {
    try {
        // Test that icon_path column exists and works
        const result = await pool.query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'labs' AND column_name IN ('icon_path', 'icon_url')
            ORDER BY column_name
        `);
        
        console.log('✅ Icon columns in labs table:');
        console.table(result.rows);
        
        // Test a simple update
        console.log('\n🧪 Testing icon_path update...');
        const testUpdate = await pool.query(`
            UPDATE labs 
            SET icon_path = '/test/path.jpg' 
            WHERE id = 1 
            RETURNING id, title, icon_path
        `);
        
        if (testUpdate.rows.length > 0) {
            console.log('✅ Successfully updated icon_path:', testUpdate.rows[0]);
        } else {
            console.log('ℹ️  No lab with id=1 found to test');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

testIconPath();
