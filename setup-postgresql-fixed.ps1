# PostgreSQL Local Setup Script for Modulus LMS
# This script will set up a local PostgreSQL database for development

Write-Host "Setting up PostgreSQL for Modulus LMS..." -ForegroundColor Cyan

# Check if PostgreSQL is installed
try {
    $pgVersion = psql --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL not found"
    }
    Write-Host "PostgreSQL found: $pgVersion" -ForegroundColor Green
}
catch {
    Write-Host "PostgreSQL is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "Or install via chocolatey: choco install postgresql" -ForegroundColor Yellow
    exit 1
}

# Create the modulus database
Write-Host "Creating database and user..." -ForegroundColor Yellow

psql -U postgres -c "CREATE DATABASE modulus;" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Database 'modulus' created successfully" -ForegroundColor Green
}
else {
    Write-Host "Database 'modulus' might already exist" -ForegroundColor Yellow
}

# Create tables
Write-Host "Creating database tables..." -ForegroundColor Yellow

$createTablesSQL = @"
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    course_id INTEGER REFERENCES courses(id),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

-- Labs table
CREATE TABLE IF NOT EXISTS labs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_id INTEGER REFERENCES courses(id),
    lab_type VARCHAR(50) DEFAULT 'terminal',
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab sessions table
CREATE TABLE IF NOT EXISTS lab_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    lab_id INTEGER REFERENCES labs(id),
    status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lab_sessions_user_id ON lab_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_sessions_lab_id ON lab_sessions(lab_id);

-- Insert a default admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
VALUES ('admin@modulus.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample course
INSERT INTO courses (title, description, instructor_id)
VALUES ('Introduction to Programming', 'Learn the basics of programming with hands-on labs', 1)
ON CONFLICT DO NOTHING;

-- Insert sample lab
INSERT INTO labs (title, description, course_id, lab_type, config)
VALUES (
    'Linux Terminal Basics', 
    'Learn basic Linux commands in an interactive terminal',
    1,
    'terminal',
    '{"commands": ["ls", "cd", "pwd", "mkdir"], "timeout": 3600}'::jsonb
)
ON CONFLICT DO NOTHING;
"@

# Save SQL to temporary file and execute
$sqlFile = "setup_modulus_db.sql"
$createTablesSQL | Out-File -FilePath $sqlFile -Encoding UTF8

psql -U postgres -d modulus -f $sqlFile
if ($LASTEXITCODE -eq 0) {
    Write-Host "Database tables created successfully" -ForegroundColor Green
}
else {
    Write-Host "Error creating tables" -ForegroundColor Red
}

# Clean up
Remove-Item $sqlFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "PostgreSQL setup complete!" -ForegroundColor Green
Write-Host "Database: modulus" -ForegroundColor Cyan
Write-Host "Default admin user: admin@modulus.com (password: admin123)" -ForegroundColor Cyan
Write-Host "Connection: localhost:5432" -ForegroundColor Cyan
Write-Host ""
Write-Host "Make sure to change the default admin password!" -ForegroundColor Yellow
