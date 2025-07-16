# Modulus LMS - New Cognito Database Setup
# Creates fresh database schema optimized for Cognito

param(
    [string]$Environment = "production",
    [string]$DatabaseName = "modulus_cognito_db"
)

Write-Host "🗄️ COGNITO DATABASE SETUP - FRESH START" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "Database: $DatabaseName" -ForegroundColor White
Write-Host "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan

# Test AWS connection
Write-Host "`n[INIT] Testing AWS RDS connection..." -ForegroundColor Yellow
try {
    $rdsTest = aws rds describe-db-instances --output json 2>&1
    if ($rdsTest -like "*error*") {
        Write-Host "[ERROR] AWS RDS access failed: $rdsTest" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "[SUCCESS] AWS RDS access confirmed" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] RDS connection test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create SQL schema for Cognito-optimized database
Write-Host "`n[STEP 1] Creating Cognito-optimized database schema..." -ForegroundColor Cyan

$cognitoSchema = @'
-- Modulus LMS - Cognito Optimized Database Schema
-- Generated: {0}

-- Create database
CREATE DATABASE IF NOT EXISTS $DatabaseName;
USE $DatabaseName;

-- Users table - Cognito optimized
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cognito_sub VARCHAR(255) UNIQUE NOT NULL COMMENT 'Cognito User Pool sub (unique identifier)',
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) GENERATED ALWAYS AS (CONCAT(first_name, ' ', last_name)) STORED,
    
    -- Academic/LMS specific fields
    course_code VARCHAR(50) DEFAULT NULL,
    user_role ENUM('student', 'instructor', 'admin', 'staff') DEFAULT 'student',
    enrollment_status ENUM('active', 'inactive', 'suspended', 'graduated') DEFAULT 'active',
    student_id VARCHAR(50) DEFAULT NULL COMMENT 'External student ID if applicable',
    
    -- Profile and preferences
    profile_picture_url VARCHAR(500) DEFAULT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    preferences JSON DEFAULT NULL COMMENT 'User preferences as JSON',
    
    -- Cognito sync tracking
    cognito_created_at TIMESTAMP DEFAULT NULL COMMENT 'When user was created in Cognito',
    cognito_last_modified TIMESTAMP DEFAULT NULL COMMENT 'Last modified in Cognito',
    cognito_sync_status ENUM('synced', 'pending', 'error') DEFAULT 'synced',
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255) DEFAULT NULL COMMENT 'Who created this user',
    last_login_at TIMESTAMP DEFAULT NULL,
    login_count INT DEFAULT 0,
    
    -- Soft delete
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Indexes for performance
    INDEX idx_cognito_sub (cognito_sub),
    INDEX idx_email (email),
    INDEX idx_course_code (course_code),
    INDEX idx_user_role (user_role),
    INDEX idx_enrollment_status (enrollment_status),
    INDEX idx_student_id (student_id),
    INDEX idx_created_at (created_at),
    INDEX idx_last_login (last_login_at),
    INDEX idx_active_users (enrollment_status, deleted_at),
    
    -- Composite indexes for common queries
    INDEX idx_course_role (course_code, user_role),
    INDEX idx_active_course_users (course_code, enrollment_status, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Courses table
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(50) UNIQUE NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    course_description TEXT DEFAULT NULL,
    
    -- Course details
    instructor_id INT DEFAULT NULL,
    department VARCHAR(100) DEFAULT NULL,
    credits INT DEFAULT NULL,
    semester VARCHAR(50) DEFAULT NULL,
    academic_year VARCHAR(10) DEFAULT NULL,
    
    -- Course status
    status ENUM('active', 'inactive', 'archived', 'draft') DEFAULT 'active',
    enrollment_open BOOLEAN DEFAULT TRUE,
    max_enrollment INT DEFAULT NULL,
    current_enrollment INT DEFAULT 0,
    
    -- Course settings
    settings JSON DEFAULT NULL COMMENT 'Course-specific settings',
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255) DEFAULT NULL,
    
    -- Soft delete
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Indexes
    INDEX idx_course_code (course_code),
    INDEX idx_instructor (instructor_id),
    INDEX idx_department (department),
    INDEX idx_status (status),
    INDEX idx_semester (semester, academic_year),
    INDEX idx_active_courses (status, deleted_at),
    
    -- Foreign key
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enrollments table - tracks user-course relationships
CREATE TABLE enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    
    -- Enrollment details
    enrollment_type ENUM('student', 'instructor', 'ta', 'observer') DEFAULT 'student',
    enrollment_status ENUM('enrolled', 'completed', 'dropped', 'withdrawn') DEFAULT 'enrolled',
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP NULL DEFAULT NULL,
    
    -- Academic tracking
    grade VARCHAR(10) DEFAULT NULL,
    grade_points DECIMAL(3,2) DEFAULT NULL,
    attendance_percentage DECIMAL(5,2) DEFAULT NULL,
    
    -- Progress tracking
    progress_data JSON DEFAULT NULL COMMENT 'Course progress as JSON',
    last_activity_at TIMESTAMP DEFAULT NULL,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255) DEFAULT NULL,
    
    -- Ensure unique enrollment per user per course
    UNIQUE KEY unique_enrollment (user_id, course_id),
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_enrollment_type (enrollment_type),
    INDEX idx_enrollment_status (enrollment_status),
    INDEX idx_enrollment_date (enrollment_date),
    INDEX idx_last_activity (last_activity_at),
    INDEX idx_active_enrollments (enrollment_status, user_id),
    INDEX idx_course_enrollments (course_id, enrollment_status),
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System configuration table
CREATE TABLE system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT DEFAULT NULL,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) DEFAULT NULL,
    
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit log table for tracking changes
CREATE TABLE audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('create', 'update', 'delete') NOT NULL,
    old_values JSON DEFAULT NULL,
    new_values JSON DEFAULT NULL,
    changed_by VARCHAR(255) DEFAULT NULL COMMENT 'Cognito sub of user making change',
    change_reason VARCHAR(255) DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_changed_by (changed_by),
    INDEX idx_created_at (created_at),
    INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('auth_method', 'cognito', 'string', 'Authentication method being used'),
('cognito_user_pool_id', '', 'string', 'AWS Cognito User Pool ID'),
('cognito_client_id', '', 'string', 'AWS Cognito App Client ID'),
('default_user_role', 'student', 'string', 'Default role for new users'),
('enrollment_auto_approve', 'true', 'boolean', 'Auto-approve course enrollments'),
('max_courses_per_user', '10', 'number', 'Maximum courses a user can enroll in'),
('academic_year', '2025', 'string', 'Current academic year'),
('semester', 'Fall', 'string', 'Current semester');

-- Create views for common queries
CREATE VIEW active_users AS
SELECT 
    u.*,
    COUNT(e.id) as enrolled_courses_count,
    MAX(e.last_activity_at) as last_course_activity
FROM users u
LEFT JOIN enrollments e ON u.id = e.user_id AND e.enrollment_status = 'enrolled'
WHERE u.deleted_at IS NULL 
    AND u.enrollment_status = 'active'
GROUP BY u.id;

CREATE VIEW course_summary AS
SELECT 
    c.*,
    COUNT(e.id) as total_enrollments,
    COUNT(CASE WHEN e.enrollment_status = 'enrolled' THEN 1 END) as active_enrollments,
    COUNT(CASE WHEN e.enrollment_status = 'completed' THEN 1 END) as completed_enrollments
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
WHERE c.deleted_at IS NULL
GROUP BY c.id;

-- Database setup complete
SELECT 'Cognito-optimized database schema created successfully!' as result;
'@

# Format the SQL with current date
$cognitoSchema = $cognitoSchema -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# Save schema to file
$cognitoSchema | Out-File -FilePath "cognito-database-schema.sql" -Encoding UTF8
Write-Host "[SUCCESS] Database schema created: cognito-database-schema.sql" -ForegroundColor Green

# Create database initialization script
Write-Host "`n[STEP 2] Creating database initialization script..." -ForegroundColor Cyan

$initScript = @"
# Initialize Cognito Database
# Run this after Cognito User Pool is created

param(
    [string]`$RdsEndpoint,
    [string]`$Username,
    [string]`$Password,
    [string]`$CognitoUserPoolId = "",
    [string]`$CognitoClientId = ""
)

if (!`$RdsEndpoint -or !`$Username -or !`$Password) {
    Write-Host "Usage: .\init-cognito-database.ps1 -RdsEndpoint <endpoint> -Username <user> -Password <pass>" -ForegroundColor Red
    exit 1
}

Write-Host "Initializing Cognito database..." -ForegroundColor Cyan

# Execute SQL schema
mysql -h `$RdsEndpoint -u `$Username -p`$Password < cognito-database-schema.sql

if (`$LASTEXITCODE -eq 0) {
    Write-Host "Database schema created successfully!" -ForegroundColor Green
    
    # Update system config with Cognito details if provided
    if (`$CognitoUserPoolId -and `$CognitoClientId) {
        Write-Host "Updating system configuration..." -ForegroundColor Yellow
        
        `$updateConfig = @"
USE modulus_cognito_db;
UPDATE system_config SET config_value = '`$CognitoUserPoolId' WHERE config_key = 'cognito_user_pool_id';
UPDATE system_config SET config_value = '`$CognitoClientId' WHERE config_key = 'cognito_client_id';
SELECT 'Configuration updated!' as result;
"@
        
        `$updateConfig | mysql -h `$RdsEndpoint -u `$Username -p`$Password
        Write-Host "System configuration updated with Cognito details!" -ForegroundColor Green
    }
} else {
    Write-Host "Database initialization failed!" -ForegroundColor Red
    exit 1
}
"@

$initScript | Out-File -FilePath "init-cognito-database.ps1" -Encoding UTF8
Write-Host "[SUCCESS] Database initialization script created: init-cognito-database.ps1" -ForegroundColor Green

# Create sample data script
Write-Host "`n[STEP 3] Creating sample data script..." -ForegroundColor Cyan

$sampleData = @"
-- Sample data for Cognito database
USE modulus_cognito_db;

-- Sample courses
INSERT INTO courses (course_code, course_name, course_description, department, credits, semester, academic_year, status) VALUES
('CS101', 'Introduction to Computer Science', 'Basic programming concepts and problem solving', 'Computer Science', 3, 'Fall', '2025', 'active'),
('CS201', 'Data Structures and Algorithms', 'Advanced programming with data structures', 'Computer Science', 4, 'Fall', '2025', 'active'),
('MATH101', 'Calculus I', 'Differential and integral calculus', 'Mathematics', 4, 'Fall', '2025', 'active'),
('ENG101', 'English Composition', 'Academic writing and communication', 'English', 3, 'Fall', '2025', 'active'),
('PHYS101', 'General Physics I', 'Mechanics and thermodynamics', 'Physics', 4, 'Fall', '2025', 'active');

-- Note: Users will be created via Cognito, not directly in database
-- The Lambda function will create database records when users are created in Cognito

SELECT 'Sample data inserted successfully!' as result;
SELECT COUNT(*) as total_courses FROM courses;
"@

$sampleData | Out-File -FilePath "sample-data.sql" -Encoding UTF8
Write-Host "[SUCCESS] Sample data script created: sample-data.sql" -ForegroundColor Green

# Create environment configuration for database
Write-Host "`n[STEP 4] Creating database environment configuration..." -ForegroundColor Cyan

$dbConfig = @"
# Modulus LMS - Cognito Database Configuration
# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# Database Configuration
DB_NAME=$DatabaseName
DB_ENGINE=mysql
DB_CHARSET=utf8mb4

# Connection Configuration (fill in your RDS details)
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=3306
DB_USERNAME=admin
DB_PASSWORD=your-secure-password

# Lambda Environment Variables
DATABASE_URL=mysql://admin:password@your-rds-endpoint.region.rds.amazonaws.com:3306/$DatabaseName
DB_CONNECTION_LIMIT=10
DB_TIMEOUT=30000

# Application Configuration
DEFAULT_USER_ROLE=student
ENROLLMENT_AUTO_APPROVE=true
MAX_COURSES_PER_USER=10
ACADEMIC_YEAR=2025
CURRENT_SEMESTER=Fall
"@

$dbConfig | Out-File -FilePath ".env.database" -Encoding UTF8
Write-Host "[SUCCESS] Database environment config created: .env.database" -ForegroundColor Green

Write-Host "`n🎉 COGNITO DATABASE SETUP COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Files Created:" -ForegroundColor White
Write-Host "  cognito-database-schema.sql - Complete database schema" -ForegroundColor Yellow
Write-Host "  init-cognito-database.ps1 - Database initialization script" -ForegroundColor Yellow
Write-Host "  sample-data.sql - Sample courses and data" -ForegroundColor Yellow
Write-Host "  .env.database - Database environment config" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor White
Write-Host "  1. Update .env.database with your RDS endpoint details" -ForegroundColor Gray
Write-Host "  2. Run: .\init-cognito-database.ps1 -RdsEndpoint <endpoint> -Username <user> -Password <pass>" -ForegroundColor Gray
Write-Host "  3. Load sample data: mysql < sample-data.sql" -ForegroundColor Gray
Write-Host "  4. Proceed with Cognito User Pool setup" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Database Features:" -ForegroundColor White
Write-Host "  ✅ Cognito-optimized schema (no password storage)" -ForegroundColor Gray
Write-Host "  ✅ Academic/LMS specific fields" -ForegroundColor Gray
Write-Host "  ✅ Audit logging and change tracking" -ForegroundColor Gray
Write-Host "  ✅ Performance-optimized indexes" -ForegroundColor Gray
Write-Host "  ✅ Soft delete and data integrity" -ForegroundColor Gray
Write-Host "  ✅ JSON fields for flexible data" -ForegroundColor Gray
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
