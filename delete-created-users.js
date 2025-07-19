const { pool } = require('./backend/db.js');

async function deleteCreatedUsers() {
    try {
        // First, show the users that will be deleted
        const usersToDelete = await pool.query(`
            SELECT id, name, email, role 
            FROM users 
            WHERE id BETWEEN 50 AND 64 
            ORDER BY id;
        `);
        
        console.log('Users to be deleted:');
        console.table(usersToDelete.rows);
        
        if (usersToDelete.rows.length === 0) {
            console.log('No users found in the ID range 50-64 to delete.');
            process.exit(0);
        }
        
        // Start a transaction
        await pool.query('BEGIN');
        
        try {
            // Delete users with IDs 50-64
            const deleteResult = await pool.query(`
                DELETE FROM users 
                WHERE id BETWEEN 50 AND 64
                RETURNING id, name, email;
            `);
            
            console.log('\nDeleted users:');
            console.table(deleteResult.rows);
            console.log(`Total users deleted: ${deleteResult.rows.length}`);
            
            await pool.query('COMMIT');
            console.log('\nTransaction committed successfully!');
            
            // Verify deletion
            const remainingUsers = await pool.query(`
                SELECT id, name, email, role 
                FROM users 
                ORDER BY id;
            `);
            
            console.log('\nRemaining users in database:');
            console.table(remainingUsers.rows);
            
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

deleteCreatedUsers();
