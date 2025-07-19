const { pool } = require('./backend/db.js');

async function renumberUsers() {
    try {
        // First, get all the example.com users ordered by their current ID
        const users = await pool.query(`
            SELECT id, name, email, role 
            FROM users 
            WHERE email LIKE '%@example.com' 
            ORDER BY id;
        `);

        console.log('Found', users.rows.length, 'users to renumber');

        // Create a mapping of old ID to new ID (starting from 50)
        const idMapping = {};
        users.rows.forEach((user, index) => {
            idMapping[user.id] = 50 + index;
        });

        console.log('ID Mapping:');
        console.table(idMapping);

        // Start a transaction
        await pool.query('BEGIN');

        try {
            // Temporarily disable foreign key checks by updating to negative IDs first
            console.log('Step 1: Moving to temporary negative IDs...');
            for (const user of users.rows) {
                const tempId = -user.id;
                await pool.query('UPDATE users SET id = $1 WHERE id = $2', [tempId, user.id]);
            }

            // Now update to the new IDs starting from 50
            console.log('Step 2: Updating to new IDs starting from 50...');
            let newId = 50;
            for (const user of users.rows) {
                const tempId = -user.id;
                await pool.query('UPDATE users SET id = $1 WHERE id = $2', [newId, tempId]);
                console.log(`Updated ${user.name} from ${user.id} to ${newId}`);
                newId++;
            }

            // Reset the sequence to continue from the highest ID
            const maxId = await pool.query('SELECT MAX(id) as max_id FROM users');
            const nextSeqValue = maxId.rows[0].max_id + 1;
            await pool.query(`SELECT setval('users_id_seq', $1, false)`, [nextSeqValue]);

            await pool.query('COMMIT');
            console.log('Transaction committed successfully!');

            // Verify the changes
            const updatedUsers = await pool.query(`
                SELECT id, name, email, role 
                FROM users 
                WHERE email LIKE '%@example.com' 
                ORDER BY id;
            `);

            console.log('\nUpdated users:');
            console.table(updatedUsers.rows);

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

renumberUsers();
