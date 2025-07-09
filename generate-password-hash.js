const bcrypt = require('bcryptjs');

const password = 'Mahtabmehek@1337';
const saltRounds = 12;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('');
  console.log('SQL UPDATE:');
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE email IN ('student@test.com', 'instructor@test.com', 'admin@test.com', 'student@modulus.com', 'instructor@modulus.com', 'admin@modulus.com');`);
  
  // Verify the hash works
  bcrypt.compare(password, hash, (err, result) => {
    if (err) {
      console.error('Error verifying hash:', err);
      process.exit(1);
    }
    
    console.log('');
    console.log('Hash verification:', result ? 'SUCCESS' : 'FAILED');
    process.exit(0);
  });
});
