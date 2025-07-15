const bcrypt = require('bcryptjs');

async function hashPassword() {
    const password = 'test123';
    const hash = await bcrypt.hash(password, 12);
    console.log('Password hash for "test123":', hash);
}

hashPassword().catch(console.error);
