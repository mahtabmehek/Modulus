const { pool } = require('./db');

async function checkUsersTable() {
    try {
        const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);

        console.log('Users table columns:');
        console.log('==========================================');
        result.rows.forEach(row => {
            console.log(`${row.column_name.padEnd(20)} | ${row.data_type.padEnd(25)} | Nullable: ${row.is_nullable}`);
        });
        console.log('==========================================');

        // Check specifically for department column
        const departmentExists = result.rows.some(row => row.column_name === 'department');
        console.log(`\nDepartment column exists: ${departmentExists ? 'YES' : 'NO'}`);

        // Also get a sample row to see actual data
        const sampleResult = await pool.query('SELECT * FROM users LIMIT 1');
        console.log('\nSample row keys:');
        if (sampleResult.rows.length > 0) {
            console.log(Object.keys(sampleResult.rows[0]));
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkUsersTable();
