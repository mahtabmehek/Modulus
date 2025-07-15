const bcrypt = require('bcryptjs');

// Generate password hash
const password = 'Mahtabmehek@1337';
const saltRounds = 12;

console.log('Generating password hash for:', password);
console.log('Using salt rounds:', saltRounds);
console.log('');

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  
  console.log('Password hash generated:');
  console.log(hash);
  console.log('');
  
  // Generate SQL with the correct hash
  const users = [
    { email: 'student@test.com', name: 'John Student', role: 'student' },
    { email: 'instructor@test.com', name: 'Jane Instructor', role: 'instructor' },
    { email: 'staff@test.com', name: 'Mike Staff', role: 'staff' },
    { email: 'admin@test.com', name: 'Sarah Admin', role: 'admin' }
  ];
  
  console.log('SQL commands with correct password hash:');
  console.log('-- Insert test users with bcrypt hash');
  console.log('');
  
  users.forEach(user => {
    console.log(`INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) VALUES ('${user.email}', '${hash}', '${user.name}', '${user.role}', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;`);
  });
  
  console.log('');
  console.log('-- Verify users were created');
  console.log("SELECT id, email, name, role, is_approved FROM users WHERE email IN ('student@test.com', 'instructor@test.com', 'staff@test.com', 'admin@test.com');");
  
  console.log('');
  console.log('='.repeat(50));
  console.log('COPY THE SQL COMMANDS ABOVE AND EXECUTE THEM ON YOUR DATABASE');
  console.log('='.repeat(50));
});
