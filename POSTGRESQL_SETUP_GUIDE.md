# 🗄️ Modulus LMS - PostgreSQL Database Setup Guide

**Date Created**: July 18, 2025  
**System**: Modulus Learning Management System  
**Environment**: Local Development (Windows)  
**Database**: PostgreSQL 15+  

---

## 📋 Table of Contents
1. [PostgreSQL Installation](#postgresql-installation)
2. [Database Creation](#database-creation)
3. [Table Schema](#table-schema)
4. [Test Data Population](#test-data-population)
5. [Environment Configuration](#environment-configuration)
6. [Backend Database Connection](#backend-database-connection)
7. [Verification & Testing](#verification-testing)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 PostgreSQL Installation

### Step 1: Install PostgreSQL on Windows
```powershell
# Download PostgreSQL from official website
# https://www.postgresql.org/download/windows/

# Installation details:
# - Version: PostgreSQL 15 or higher
# - Port: 5432 (default)
# - Superuser: postgres
# - Password: mahtab (set during installation)
```

### Step 2: Verify Installation
```powershell
# Open Command Prompt or PowerShell
psql --version

# Expected output: psql (PostgreSQL) 15.x
```

---

## 🏗️ Database Creation

### Step 1: Connect to PostgreSQL
```sql
-- Connect as superuser
psql -U postgres -h localhost

-- Enter password: mahtab
```

### Step 2: Create Database
```sql
-- Create the modulus database
CREATE DATABASE modulus;

-- Connect to the new database
\c modulus;

-- Verify connection
SELECT current_database();
```

---

## 📊 Table Schema

### 1. Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'instructor', 'staff', 'admin')),
    is_approved BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    access_code VARCHAR(100),
    level_id INTEGER DEFAULT 1,
    total_points INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_approved ON users(is_approved);
```

### 2. Courses Table
```sql
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_active ON courses(is_active);
```

### 3. Labs Table
```sql
CREATE TABLE labs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    lab_content TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 10),
    estimated_duration INTEGER DEFAULT 60, -- minutes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_labs_course ON labs(course_id);
CREATE INDEX idx_labs_difficulty ON labs(difficulty_level);
CREATE INDEX idx_labs_active ON labs(is_active);
```

### 4. Enrollments Table
```sql
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    progress DECIMAL(5,2) DEFAULT 0.00,
    completed_labs INTEGER DEFAULT 0,
    total_labs INTEGER DEFAULT 0,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate enrollments
    UNIQUE(user_id, course_id)
);

-- Add indexes
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_progress ON enrollments(progress);
```

### 5. Lab Sessions Table
```sql
CREATE TABLE lab_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    lab_id INTEGER REFERENCES labs(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    score DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_lab_sessions_user ON lab_sessions(user_id);
CREATE INDEX idx_lab_sessions_lab ON lab_sessions(lab_id);
CREATE INDEX idx_lab_sessions_status ON lab_sessions(status);
```

### 6. User Levels Table (for gamification)
```sql
CREATE TABLE user_levels (
    id SERIAL PRIMARY KEY,
    level_number INTEGER UNIQUE NOT NULL,
    level_name VARCHAR(100) NOT NULL,
    min_points INTEGER NOT NULL,
    max_points INTEGER,
    badge_color VARCHAR(50) DEFAULT '#gray',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default levels
INSERT INTO user_levels (level_number, level_name, min_points, max_points, badge_color) VALUES
(1, 'Beginner', 0, 99, '#green'),
(2, 'Novice', 100, 249, '#blue'),
(3, 'Intermediate', 250, 499, '#purple'),
(4, 'Advanced', 500, 999, '#orange'),
(5, 'Expert', 1000, 1999, '#red'),
(6, 'Master', 2000, 4999, '#gold'),
(7, 'Professional', 5000, 9999, '#platinum'),
(8, 'Elite', 10000, 19999, '#diamond'),
(9, 'Champion', 20000, 49999, '#ruby'),
(10, 'Legend', 50000, NULL, '#cosmic');
```

---

## 👥 Test Data Population

### 1. Create Test Users with Hashed Passwords
```sql
-- Insert test users (password: Mahtabmehek@1337)
-- Password hash generated using bcrypt with salt rounds 10

INSERT INTO users (email, password_hash, first_name, last_name, role, is_approved, is_verified, level_id, total_points) VALUES
('admin@test.com', '$2b$10$rZ9OQ8YgJBYn8YBCLhc8G.xQw4zKm8XL1YqGQOsGc.VBn9tEp6B6e', 'Test', 'Admin', 'admin', true, true, 10, 1000),
('instructor@test.com', '$2b$10$rZ9OQ8YgJBYn8YBCLhc8G.xQw4zKm8XL1YqGQOsGc.VBn9tEp6B6e', 'Test', 'Instructor', 'instructor', true, true, 5, 500),
('student@test.com', '$2b$10$rZ9OQ8YgJBYn8YBCLhc8G.xQw4zKm8XL1YqGQOsGc.VBn9tEp6B6e', 'Test', 'Student', 'student', true, true, 1, 100),
('staff@test.com', '$2b$10$rZ9OQ8YgJBYn8YBCLhc8G.xQw4zKm8XL1YqGQOsGc.VBn9tEp6B6e', 'Test', 'Staff', 'staff', true, true, 7, 750);
```

### 2. Create Sample Courses
```sql
INSERT INTO courses (title, description, instructor_id) VALUES
('Web Development Fundamentals', 'Learn the basics of HTML, CSS, and JavaScript', 2),
('Cybersecurity Essentials', 'Introduction to cybersecurity principles and practices', 2),
('Database Design', 'Fundamentals of relational database design and SQL', 2),
('System Administration', 'Linux system administration and server management', 2);
```

### 3. Create Sample Labs
```sql
INSERT INTO labs (title, description, course_id, difficulty_level, estimated_duration) VALUES
('HTML Basics', 'Learn HTML structure and basic tags', 1, 1, 60),
('CSS Styling', 'Introduction to CSS and responsive design', 1, 2, 90),
('JavaScript Fundamentals', 'Variables, functions, and DOM manipulation', 1, 3, 120),
('Network Security Lab', 'Analyze network traffic and identify threats', 2, 5, 150),
('SQL Queries', 'Basic and advanced SQL query techniques', 3, 3, 90),
('Linux Command Line', 'Essential Linux commands and file system navigation', 4, 2, 75);
```

### 4. Create Sample Enrollments
```sql
INSERT INTO enrollments (user_id, course_id, progress, completed_labs, total_labs) VALUES
(3, 1, 33.33, 1, 3), -- Student enrolled in Web Development
(3, 2, 0.00, 0, 1),  -- Student enrolled in Cybersecurity
(3, 3, 100.00, 1, 1); -- Student completed Database course
```

---

## ⚙️ Environment Configuration

### Backend .env File
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=modulus
DB_USER=postgres
DB_PASSWORD=mahtab

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-modulus-2025

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3002,http://localhost:3003
```

---

## 🔌 Backend Database Connection

### Database Connection Setup (server.js)
```javascript
const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'modulus',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'mahtab',
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

module.exports = { pool };
```

### Authentication Route Example
```javascript
// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Query user from database
    const userQuery = `
      SELECT u.*, ul.level_name 
      FROM users u 
      LEFT JOIN user_levels ul ON u.level_id = ul.level_number 
      WHERE u.email = $1 AND u.is_approved = true
    `;
    
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user data and token
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        level: user.level_id,
        level_name: user.level_name || 'Beginner',
        total_points: user.total_points,
        streak_days: user.streak_days
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## ✅ Verification & Testing

### 1. Verify Tables Created
```sql
-- List all tables
\dt

-- Check users table structure
\d users

-- Verify sample data
SELECT id, email, first_name, last_name, role, is_approved FROM users;
```

### 2. Test Queries
```sql
-- Test user authentication query
SELECT u.*, ul.level_name 
FROM users u 
LEFT JOIN user_levels ul ON u.level_id = ul.level_number 
WHERE u.email = 'admin@test.com' AND u.is_approved = true;

-- Test course enrollment query
SELECT c.title, e.progress, e.completed_labs, e.total_labs
FROM enrollments e
JOIN courses c ON e.course_id = c.id
WHERE e.user_id = 3;

-- Test lab session query
SELECT l.title, ls.status, ls.start_time, ls.duration_minutes
FROM lab_sessions ls
JOIN labs l ON ls.lab_id = l.id
WHERE ls.user_id = 3;
```

### 3. Backend API Testing
```bash
# Test login endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Mahtabmehek@1337"}'

# Expected response: JWT token and user data
```

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. Connection Refused
```bash
# Check if PostgreSQL is running
systemctl status postgresql  # Linux
Get-Service postgresql*       # Windows PowerShell

# Start PostgreSQL service
systemctl start postgresql    # Linux
Start-Service postgresql-x64-15  # Windows
```

#### 2. Authentication Failed
```sql
-- Reset postgres user password
ALTER USER postgres PASSWORD 'mahtab';

-- Check pg_hba.conf for authentication method
-- Location: C:\Program Files\PostgreSQL\15\data\pg_hba.conf
-- Ensure method is 'md5' for local connections
```

#### 3. Database Connection Issues
```javascript
// Test connection in Node.js
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0]);
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
};
```

#### 4. Password Hash Issues
```javascript
// Generate new password hash
const bcrypt = require('bcryptjs');

const generateHash = async (password) => {
  const hash = await bcrypt.hash(password, 10);
  console.log('Password hash:', hash);
  return hash;
};

// Usage: generateHash('Mahtabmehek@1337');
```

---

## 📝 Important Notes

1. **Password Security**: All passwords are hashed using bcrypt with 10 salt rounds
2. **Default Credentials**: All test users use password `Mahtabmehek@1337`
3. **Database Location**: Windows - `C:\Program Files\PostgreSQL\15\data`
4. **Backup Command**: `pg_dump -U postgres modulus > backup.sql`
5. **Restore Command**: `psql -U postgres modulus < backup.sql`

---

## 🎯 Quick Setup Summary

```bash
# 1. Install PostgreSQL (postgres/mahtab)
# 2. Create database
createdb -U postgres modulus

# 3. Run schema creation script
psql -U postgres -d modulus -f schema.sql

# 4. Insert test data
psql -U postgres -d modulus -f test_data.sql

# 5. Configure environment
cp .env.example .env

# 6. Start backend
cd backend && npm start

# 7. Test connection
curl http://localhost:3001/api/health
```

---

**This setup provides a complete PostgreSQL database foundation for the Modulus LMS with user authentication, course management, lab tracking, and gamification features. All test credentials and connection details are documented for easy system restoration.**
