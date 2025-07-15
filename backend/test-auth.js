const RDSDataClient = require('./rds-data-client');

async function testAuth() {
    const db = new RDSDataClient();
    try {
        console.log('Testing authentication...');

        // First, let's verify we can connect to auth routes
        console.log('Checking auth route setup...');

        // Test if we can find the user
        const user = await db.query('SELECT * FROM users WHERE email = $1', ['staffuser@test.com']);
        console.log('User found:', user.rows.length > 0 ? 'Yes' : 'No');

        if (user.rows.length > 0) {
            console.log('User details:', {
                id: user.rows[0].id,
                email: user.rows[0].email,
                name: user.rows[0].name,
                role: user.rows[0].role,
                is_approved: user.rows[0].is_approved
            });

            // Check if password hash exists
            console.log('Password hash exists:', user.rows[0].password_hash ? 'Yes' : 'No');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAuth();
