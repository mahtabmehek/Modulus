const { pool } = require('./db');

async function debugLabIssue() {
    try {
        console.log('🔍 Debugging lab 122 issue...');

        // Check all labs
        const allLabs = await pool.query('SELECT * FROM labs ORDER BY id');
        console.log('\n📚 All labs in database:');
        allLabs.rows.forEach(lab => {
            console.log(`  - ID: ${lab.id}, Title: "${lab.title}", Type: ${typeof lab.id}`);
        });

        // Specifically check for lab 122
        const lab122 = await pool.query('SELECT * FROM labs WHERE id = 122');
        console.log('\n🔍 Lab 122 specifically:');
        console.log('Found:', lab122.rows.length > 0 ? 'YES' : 'NO');
        if (lab122.rows.length > 0) {
            console.log('Data:', lab122.rows[0]);
        }

        // Check if 122 exists as string
        const lab122String = await pool.query('SELECT * FROM labs WHERE id = $1', ['122']);
        console.log('\n🔍 Lab "122" as string:');
        console.log('Found:', lab122String.rows.length > 0 ? 'YES' : 'NO');

        // Check current module_labs state
        const moduleLabsCount = await pool.query('SELECT COUNT(*) FROM module_labs');
        console.log('\n🔗 Current module_labs count:', moduleLabsCount.rows[0].count);

        // Try to insert directly (outside transaction)
        console.log('\n🧪 Testing direct insert to module_labs...');
        try {
            await pool.query('INSERT INTO module_labs (module_id, lab_id, order_index) VALUES (152, 122, 99) ON CONFLICT DO NOTHING');
            console.log('✅ Direct insert successful');
        } catch (error) {
            console.log('❌ Direct insert failed:', error.message);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

debugLabIssue();
