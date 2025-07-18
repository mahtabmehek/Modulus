-- Modulus LMS Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'staff', 'admin')),
    is_approved BOOLEAN DEFAULT FALSE,
    course_code VARCHAR(50), -- Assigned course code for students
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Profile information
    level INTEGER DEFAULT 1,
    level_name VARCHAR(100) DEFAULT 'Beginner',
    badges TEXT[] DEFAULT '{}',
    streak_days INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    
    -- Approval tracking
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    
    -- Preferences (stored as JSONB for flexibility)
    preferences JSONB DEFAULT '{"theme": "system", "language": "en", "notifications": {"email": true, "push": true, "announcements": true, "labUpdates": true}}'::jsonb
);

-- Access codes table for invitation system
CREATE TABLE IF NOT EXISTS access_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'staff', 'admin')),
    created_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    used_by INTEGER REFERENCES users(id),
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    description TEXT
);

-- Courses table
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

-- Learning paths table
CREATE TABLE IF NOT EXISTS learning_paths (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Path metadata
    difficulty_level VARCHAR(50) DEFAULT 'beginner',
    estimated_hours INTEGER,
    tags TEXT[]
);

-- Modules table (within courses)
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

-- Labs table
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
    auto_grade BOOLEAN DEFAULT FALSE,
    
    -- Icon/Image and Metadata
    icon_url TEXT,
    icon_path VARCHAR(500),
    tags TEXT[]
);

-- User progress tracking
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

-- Lab sessions for remote desktop/container access
CREATE TABLE IF NOT EXISTS lab_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    lab_id INTEGER REFERENCES labs(id) ON DELETE CASCADE,
    
    -- Session details
    session_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'starting' CHECK (status IN ('starting', 'running', 'stopped', 'failed', 'expired')),
    
    -- Connection details
    connection_type VARCHAR(50) DEFAULT 'vnc' CHECK (connection_type IN ('vnc', 'rdp', 'ssh', 'web')),
    connection_url VARCHAR(500),
    internal_ip VARCHAR(45),
    vnc_port INTEGER,
    ssh_port INTEGER,
    
    -- Timing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    expires_at TIMESTAMP,
    terminated_at TIMESTAMP,
    
    -- Resource usage
    cpu_limit INTEGER, -- millicores
    memory_limit INTEGER, -- MB
    storage_limit INTEGER, -- MB
    
    -- Session metadata
    vm_instance_id VARCHAR(255),
    container_id VARCHAR(255),
    metadata JSONB
);

-- Desktop Sessions Table
CREATE TABLE IF NOT EXISTS desktop_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    lab_id INTEGER,
    container_id VARCHAR(255) UNIQUE,
    vnc_port INTEGER,
    web_port INTEGER,
    status VARCHAR(50) DEFAULT 'running',
    session_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    terminated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_desktop_sessions_user_id ON desktop_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_desktop_sessions_status ON desktop_sessions(status);
CREATE INDEX IF NOT EXISTS idx_desktop_sessions_container_id ON desktop_sessions(container_id);

-- Enrollments table
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

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id),
    target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'instructors', 'staff')),
    priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Scheduling
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- Metadata
    is_pinned BOOLEAN DEFAULT FALSE,
    course_id INTEGER REFERENCES courses(id), -- NULL for global announcements
    tags TEXT[]
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_approved ON users(is_approved);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_active ON access_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_labs_module ON labs(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_lab_sessions_user ON lab_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_sessions_status ON lab_sessions(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- Insert default access code
INSERT INTO access_codes (code, role, is_active, description) 
VALUES ('mahtabmehek1337', 'student', true, 'Default access code for registration')
ON CONFLICT (code) DO NOTHING;

-- Create default admin user (password should be changed immediately)
-- Password is hashed version of 'admin123' - CHANGE THIS IN PRODUCTION
INSERT INTO users (email, password_hash, name, role, is_approved) 
VALUES (
    'admin@modulus.edu',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QWpgSwe', -- admin123
    'System Administrator',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;
