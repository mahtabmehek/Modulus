const bcrypt = require('bcryptjs');
const RDSDataClient = require('./rds-data-client');

async function createAdminUser() {
    const db = new RDSDataClient();
    
    try {
        // Get command line arguments
        const args = process.argv.slice(2);
        
        if (args.length < 3) {
            console.log('Usage: node create-admin-user.js <email> <password> <name>');
            console.log('Example: node create-admin-user.js admin@company.com SecurePass123 "Admin User"');
            process.exit(1);
        }
        
        const [email, password, name] = args;
        
        console.log('Creating admin user...');
        console.log('Email:', email);
        console.log('Name:', name);
        console.log('Role: admin');
        console.log('');
        
        // Check if user already exists
        console.log('Checking if user already exists...');
        const existingUser = await db.query('SELECT id, email FROM users WHERE email = $1', [email]);
        
        if (existingUser.rows && existingUser.rows.length > 0) {
            console.error(`❌ User with email ${email} already exists!`);
            console.log('Existing user:', JSON.stringify(existingUser.rows[0], null, 2));
            process.exit(1);
        }
        
        console.log('✅ Email is available');
        
        // Hash the password
        console.log('Hashing password...');
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        console.log('✅ Password hashed successfully');
        
        // Insert the new admin user
        console.log('Creating admin user in database...');
        const insertQuery = `
            INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING id, email, name, role, is_approved, created_at
        `;
        
        const result = await db.query(insertQuery, [
            email,
            passwordHash,
            name,
            'admin',
            true
        ]);
        
        if (result.rows && result.rows.length > 0) {
            const newUser = result.rows[0];
            console.log('');
            console.log('🎉 Admin user created successfully!');
            console.log('='.repeat(50));
            console.log('User Details:');
            console.log(`ID: ${newUser.id}`);
            console.log(`Email: ${newUser.email}`);
            console.log(`Name: ${newUser.name}`);
            console.log(`Role: ${newUser.role}`);
            console.log(`Approved: ${newUser.is_approved}`);
            console.log(`Created: ${newUser.created_at}`);
            console.log('='.repeat(50));
            console.log('');
            console.log('You can now login with:');
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
            console.log('');
            console.log('✅ Admin user creation complete!');
        } else {
            console.error('❌ Failed to create user - no result returned');
        }
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Additional utility functions
async function listAdminUsers() {
    const db = new RDSDataClient();
    try {
        console.log('Current admin users in the database:');
        const result = await db.query('SELECT id, email, name, role, is_approved, created_at FROM users WHERE role = $1 ORDER BY created_at', ['admin']);
        
        if (result.rows && result.rows.length > 0) {
            console.log('='.repeat(70));
            result.rows.forEach((user, index) => {
                console.log(`${index + 1}. ID: ${user.id} | Email: ${user.email} | Name: ${user.name} | Approved: ${user.is_approved}`);
            });
            console.log('='.repeat(70));
            console.log(`Total admin users: ${result.rows.length}`);
        } else {
            console.log('No admin users found in the database.');
        }
    } catch (error) {
        console.error('Error listing admin users:', error.message);
    }
}

async function validateUser(email, password) {
    const db = new RDSDataClient();
    try {
        console.log(`Validating user: ${email}`);
        const result = await db.query('SELECT id, email, password_hash, role FROM users WHERE email = $1', [email]);
        
        if (result.rows && result.rows.length > 0) {
            const user = result.rows[0];
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            
            if (isValidPassword) {
                console.log('✅ User credentials are valid');
                console.log(`Role: ${user.role}`);
                return true;
            } else {
                console.log('❌ Invalid password');
                return false;
            }
        } else {
            console.log('❌ User not found');
            return false;
        }
    } catch (error) {
        console.error('Error validating user:', error.message);
        return false;
    }
}

// Check command line arguments for different actions
const action = process.argv[2];

if (action === '--list' || action === '-l') {
    listAdminUsers();
} else if (action === '--validate' || action === '-v') {
    if (process.argv.length < 5) {
        console.log('Usage: node create-admin-user.js --validate <email> <password>');
        process.exit(1);
    }
    const [, , , email, password] = process.argv;
    validateUser(email, password);
} else if (action === '--help' || action === '-h') {
    console.log('Admin User Management CLI');
    console.log('');
    console.log('Usage:');
    console.log('  Create admin user:    node create-admin-user.js <email> <password> <name>');
    console.log('  List admin users:     node create-admin-user.js --list');
    console.log('  Validate user:        node create-admin-user.js --validate <email> <password>');
    console.log('  Show help:           node create-admin-user.js --help');
    console.log('');
    console.log('Examples:');
    console.log('  node create-admin-user.js admin@company.com SecurePass123 "System Administrator"');
    console.log('  node create-admin-user.js --list');
    console.log('  node create-admin-user.js --validate admin@company.com SecurePass123');
} else {
    createAdminUser();
}
