// Mock database for local development
const bcrypt = require('bcryptjs');

class MockDatabase {
  constructor() {
    this.users = [];
    this.accessCodes = [];
    this.initializeTestUsers();
  }

  async initializeTestUsers() {
    const saltRounds = 12;
    
    // Create test users with hashed passwords
    const testUsers = [
      {
        id: 'user-1',
        email: 'student@test.com',
        password: 'student123',
        name: 'Test Student',
        role: 'student',
        is_approved: true
      },
      {
        id: 'user-2', 
        email: 'instructor@test.com',
        password: 'instructor123',
        name: 'Test Instructor',
        role: 'instructor',
        is_approved: true
      },
      {
        id: 'user-3',
        email: 'admin@test.com',
        password: 'admin123',
        name: 'Test Admin',
        role: 'admin',
        is_approved: true
      }
    ];

    for (const user of testUsers) {
      const passwordHash = await bcrypt.hash(user.password, saltRounds);
      this.users.push({
        ...user,
        password_hash: passwordHash,
        created_at: new Date(),
        last_active: new Date(),
        level: 1,
        level_name: 'Beginner',
        badges: [],
        streak_days: 0,
        total_points: 0
      });
    }

    console.log('✅ Mock database initialized with test users');
  }

  async query(sql, params = []) {
    // Mock different SQL queries
    if (sql.includes('SELECT * FROM users WHERE email = $1')) {
      const email = params[0];
      const user = this.users.find(u => u.email === email);
      return { rows: user ? [user] : [] };
    }
    
    if (sql.includes('SELECT id FROM users WHERE email = $1')) {
      const email = params[0];
      const user = this.users.find(u => u.email === email);
      return { rows: user ? [{ id: user.id }] : [] };
    }
    
    if (sql.includes('INSERT INTO users')) {
      const [email, passwordHash, name, role, isApproved] = params;
      const newUser = {
        id: `user-${Date.now()}`,
        email,
        password_hash: passwordHash,
        name,
        role,
        is_approved: isApproved,
        created_at: new Date(),
        last_active: new Date(),
        level: 1,
        level_name: 'Beginner',
        badges: [],
        streak_days: 0,
        total_points: 0
      };
      this.users.push(newUser);
      return { rows: [newUser] };
    }

    if (sql.includes('UPDATE users SET last_active = NOW()')) {
      const userId = params[0];
      const user = this.users.find(u => u.id === userId);
      if (user) {
        user.last_active = new Date();
      }
      return { rows: [] };
    }

    if (sql.includes('SELECT * FROM access_codes')) {
      return { rows: [] }; // No access codes for simplified login
    }

    // Default empty result
    return { rows: [] };
  }

  async connect() {
    return {
      release: () => {}
    };
  }
}

module.exports = MockDatabase;
