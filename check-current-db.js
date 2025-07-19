const { pool } = require('./backend/db.js');

async function checkCurrentDatabase() {
    try {
        // Check database name and connection info
        const dbInfo = await pool.query('SELECT current_database(), current_user;');
        console.log('Connected to database:', dbInfo.rows[0]);

        // Check all users currently in the database
        const users = await pool.query(`
            SELECT id, name, email, role, is_approved, created_at::date as created_date
            FROM users 
            ORDER BY id;
        `);

        console.log('\nCurrent users in database:');
        console.table(users.rows);

        // Check if we have the users starting from ID 50
        const usersFrom50 = await pool.query(`
            SELECT id, name, email, role 
            FROM users 
            WHERE id >= 50 
            ORDER BY id;
        `);

        console.log('\nUsers with ID 50 and above:');
        console.table(usersFrom50.rows);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkCurrentDatabase();
