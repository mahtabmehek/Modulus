const RDSDataClient = require('./rds-data-client');

async function findStaffUser() {
    const db = new RDSDataClient();
    try {
        console.log('Searching for staffuser@test.com...');
        const result = await db.query('SELECT * FROM users WHERE email = $1', ['staffuser@test.com']);

        if (result.rows && result.rows.length > 0) {
            console.log('Found staffuser@test.com:', JSON.stringify(result.rows[0], null, 2));
        } else {
            console.log('No user found with email staffuser@test.com');

            // Check for any staff users
            console.log('\nLooking for users with "staff" in email...');
            const staff = await db.query('SELECT email, name, role FROM users WHERE email LIKE $1', ['%staff%']);
            console.log('Staff users found:', JSON.stringify(staff.rows, null, 2));

            // Show all users for reference
            console.log('\nAll users in database:');
            const allUsers = await db.query('SELECT id, email, name, role, is_approved FROM users ORDER BY id');
            console.log(JSON.stringify(allUsers.rows, null, 2));
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

findStaffUser();
