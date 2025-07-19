const { pool } = require('./backend/db.js');
const fs = require('fs');

async function createUsers() {
    try {
        const sql = fs.readFileSync('./create-users.sql', 'utf8');

        // Split the SQL into individual statements
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

        for (const statement of statements) {
            if (statement.trim()) {
                const result = await pool.query(statement.trim());
                if (result.rows && result.rows.length > 0) {
                    console.log('Query result:', result.rows);
                }
            }
        }

        console.log('All users created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating users:', error.message);
        process.exit(1);
    }
}

createUsers();
