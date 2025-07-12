const bcrypt = require('bcryptjs');

const password = 'Mahtabmehek@1337';

bcrypt.hash(password, 12).then(hash => {
    console.log('='.repeat(50));
    console.log('MODULUS LMS - DATABASE USER POPULATION');
    console.log('='.repeat(50));
    console.log('Password hash generated:', hash);
    console.log('');
    console.log('SQL Commands to insert test users:');
    console.log('');
    
    console.log('INSERT INTO users (email, password_hash, name, role, is_approved, created_at) VALUES');
    console.log(`  ('student@test.com', '${hash}', 'John Student', 'student', true, CURRENT_TIMESTAMP),`);
    console.log(`  ('instructor@test.com', '${hash}', 'Jane Instructor', 'instructor', true, CURRENT_TIMESTAMP),`);
    console.log(`  ('staff@test.com', '${hash}', 'Mike Staff', 'staff', true, CURRENT_TIMESTAMP),`);
    console.log(`  ('admin@test.com', '${hash}', 'Sarah Admin', 'admin', true, CURRENT_TIMESTAMP)`);
    console.log('ON CONFLICT (email) DO NOTHING;');
    console.log('');
    console.log('-- Verify users were created:');
    console.log('SELECT id, email, name, role, is_approved, created_at FROM users;');
    console.log('');
    console.log('='.repeat(50));
    console.log('COPY THE SQL COMMANDS ABOVE AND RUN THEM ON YOUR DATABASE');
    console.log('Default password for all users: Mahtabmehek@1337');
    console.log('='.repeat(50));
}).catch(console.error);
