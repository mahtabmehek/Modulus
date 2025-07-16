# Simple Cognito Database Creator
Write-Host "Creating Cognito Database Files..." -ForegroundColor Cyan

# Create database schema
$schema = @'
-- Modulus LMS Cognito Database Schema
CREATE DATABASE IF NOT EXISTS modulus_cognito_db;
USE modulus_cognito_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cognito_sub VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    course_code VARCHAR(50) DEFAULT NULL,
    user_role ENUM('student', 'instructor', 'admin', 'staff') DEFAULT 'student',
    enrollment_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cognito_sub (cognito_sub),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(50) UNIQUE NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    instructor_id INT DEFAULT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_status ENUM('enrolled', 'completed', 'dropped') DEFAULT 'enrolled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_enrollment (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'Database schema created successfully!' as result;
'@

$schema | Out-File -FilePath "cognito-schema.sql" -Encoding UTF8
Write-Host "Created: cognito-schema.sql" -ForegroundColor Green

# Create sample data
$sampleData = @'
USE modulus_cognito_db;

INSERT INTO courses (course_code, course_name, status) VALUES
('CS101', 'Introduction to Computer Science', 'active'),
('CS201', 'Data Structures and Algorithms', 'active'),
('MATH101', 'Calculus I', 'active');

SELECT 'Sample data inserted!' as result;
'@

$sampleData | Out-File -FilePath "sample-data.sql" -Encoding UTF8
Write-Host "Created: sample-data.sql" -ForegroundColor Green

Write-Host "Database files created successfully!" -ForegroundColor Green
