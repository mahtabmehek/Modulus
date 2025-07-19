const { pool } = require('./backend/db.js');

async function checkAllUsers() {
    try {
        const result = await pool.query(`
            SELECT id, name, email, role, is_approved, created_at 
            FROM users 
            ORDER BY role, id;
        `);

        console.log('Total users in database:', result.rows.length);
        console.log('\nAll users:');
        console.table(result.rows);

        // Specifically check for the example.com users
        const exampleUsers = await pool.query(`
            SELECT id, name, email, role, is_approved 
            FROM users 
            WHERE email LIKE '%@example.com' 
            ORDER BY role, id;
        `);

        console.log('\nExample.com users (the ones we created):');
        console.table(exampleUsers.rows);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkAllUsers();
