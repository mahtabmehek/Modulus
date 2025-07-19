-- Modulus LMS Database Schema
-- Created: July 18, 2025
-- PostgreSQL 15+

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS lab_sessions CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS labs CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_levels CASCADE;

-- Create user_levels table first (referenced by users)
CREATE TABLE user_levels (
    id SERIAL PRIMARY KEY,
    level_number INTEGER UNIQUE NOT NULL,
    level_name VARCHAR(100) NOT NULL,
    min_points INTEGER NOT NULL,
    max_points INTEGER,
    badge_color VARCHAR(50) DEFAULT '#gray',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
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
    level_id INTEGER DEFAULT 1 REFERENCES user_levels(level_number),
    total_points INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create labs table
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

-- Create enrollments table
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

-- Create lab_sessions table
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

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_approved ON users(is_approved);

CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_active ON courses(is_active);

CREATE INDEX idx_labs_course ON labs(course_id);
CREATE INDEX idx_labs_difficulty ON labs(difficulty_level);
CREATE INDEX idx_labs_active ON labs(is_active);

CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_progress ON enrollments(progress);

CREATE INDEX idx_lab_sessions_user ON lab_sessions(user_id);
CREATE INDEX idx_lab_sessions_lab ON lab_sessions(lab_id);
CREATE INDEX idx_lab_sessions_status ON lab_sessions(status);

-- Insert user levels
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

-- Display success message
SELECT 'Database schema created successfully!' as message;
