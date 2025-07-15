-- Focused Database Schema Setup for Modulus LMS
-- Creating only: courses, modules, labs, user_progress, enrollments
-- Skipping: access_codes, lab_sessions, announcements

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Courses table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    department VARCHAR(255) NOT NULL,
    academic_level VARCHAR(50) NOT NULL CHECK (academic_level IN ('bachelor', 'master', 'phd', 'certificate')),
    duration INTEGER NOT NULL CHECK (duration > 0), -- Duration in years
    total_credits INTEGER NOT NULL CHECK (total_credits > 0),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Course settings
    is_published BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT FALSE,
    
    -- Legacy fields for compatibility
    instructor_id INTEGER REFERENCES users(id),
    difficulty_level VARCHAR(50) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_hours INTEGER,
    tags TEXT[],
    auto_enroll BOOLEAN DEFAULT FALSE
);

-- 2. Modules table (within courses)
CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Module content
    content_type VARCHAR(50) DEFAULT 'mixed' CHECK (content_type IN ('text', 'video', 'lab', 'quiz', 'mixed')),
    estimated_minutes INTEGER
);

-- 3. Labs table
CREATE TABLE IF NOT EXISTS labs (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    order_index INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Lab configuration
    lab_type VARCHAR(50) DEFAULT 'vm' CHECK (lab_type IN ('vm', 'container', 'web', 'simulation')),
    estimated_minutes INTEGER DEFAULT 30,
    max_attempts INTEGER DEFAULT 0, -- 0 = unlimited
    
    -- Technical specifications
    vm_image VARCHAR(255),
    container_image VARCHAR(255),
    required_tools TEXT[],
    network_requirements JSONB,
    
    -- Scoring
    points_possible INTEGER DEFAULT 100,
    auto_grade BOOLEAN DEFAULT FALSE
);

-- 5. User progress tracking
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    lab_id INTEGER REFERENCES labs(id) ON DELETE CASCADE,
    
    -- Progress tracking
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Scoring
    score INTEGER,
    max_score INTEGER,
    attempts INTEGER DEFAULT 0,
    
    -- Additional data
    notes TEXT,
    metadata JSONB,
    
    UNIQUE(user_id, course_id, module_id, lab_id)
);

-- 7. Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'suspended')),
    
    -- Enrollment metadata
    enrolled_by INTEGER REFERENCES users(id), -- Who enrolled them (self, instructor, admin)
    completion_percentage INTEGER DEFAULT 0,
    final_grade DECIMAL(5,2),
    
    UNIQUE(user_id, course_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_labs_module ON labs(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- Insert some sample data for testing
INSERT INTO courses (title, code, description, department, academic_level, duration, total_credits, created_by, is_published) 
VALUES 
    ('Cybersecurity Fundamentals', 'CYB-101', 'Introduction to cybersecurity concepts and practices', 'Computer Science', 'bachelor', 1, 30, 1, true),
    ('Advanced Network Security', 'CYB-301', 'Advanced topics in network security and penetration testing', 'Computer Science', 'bachelor', 1, 30, 1, true),
    ('Digital Forensics', 'CYB-401', 'Computer forensics and incident response techniques', 'Computer Science', 'master', 1, 30, 1, true)
ON CONFLICT (code) DO NOTHING;

-- Add modules for the first course
INSERT INTO modules (course_id, title, description, order_index, content_type, estimated_minutes, is_published)
VALUES 
    (1, 'Introduction to Cybersecurity', 'Basic concepts and terminology', 1, 'mixed', 120, true),
    (1, 'Network Security Basics', 'Understanding network vulnerabilities', 2, 'lab', 180, true),
    (1, 'Cryptography Fundamentals', 'Encryption and decryption principles', 3, 'mixed', 150, true)
ON CONFLICT DO NOTHING;

-- Add labs for the modules
INSERT INTO labs (module_id, title, description, instructions, order_index, lab_type, estimated_minutes, points_possible, is_published)
VALUES 
    (1, 'Security Audit Lab', 'Perform a basic security audit', 'In this lab, you will learn to identify common security vulnerabilities...', 1, 'vm', 60, 100, true),
    (2, 'Network Scanning Lab', 'Use Nmap to scan networks', 'Learn to use Nmap for network discovery and security auditing...', 1, 'vm', 90, 150, true),
    (3, 'Encryption/Decryption Lab', 'Practice with encryption tools', 'Hands-on experience with various encryption algorithms...', 1, 'container', 75, 120, true)
ON CONFLICT DO NOTHING;

COMMIT;
