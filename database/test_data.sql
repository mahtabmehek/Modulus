-- Modulus LMS Test Data
-- Created: July 18, 2025
-- Run after schema.sql

-- Insert test users with hashed passwords
-- All passwords are: Mahtabmehek@1337
-- Hash generated with bcrypt, 10 salt rounds

INSERT INTO users (email, password_hash, first_name, last_name, role, is_approved, is_verified, level_id, total_points, streak_days) VALUES
('admin@test.com', '$2b$10$rZ9OQ8YgJBYn8YBCLhc8G.xQw4zKm8XL1YqGQOsGc.VBn9tEp6B6e', 'Test', 'Admin', 'admin', true, true, 10, 1000, 7),
('admin@modulus.com', '$2b$10$rZ9OQ8YgJBYn8YBCLhc8G.xQw4zKm8XL1YqGQOsGc.VBn9tEp6B6e', 'Modulus', 'Admin', 'admin', true, true, 10, 1000, 5),
('admin@modulus.edu', '$2b$10$rZ9OQ8YgJBYn8YBCLhc8G.xQw4zKm8XL1YqGQOsGc.VBn9tEp6B6e', 'System', 'Administrator', 'admin', true, true, 10, 1000, 3),

('instructor@test.com', '$2b$10$rZ9OQ8YgJBYn8YBCLhc8G.xQw4zKm8XL1YqGQOsGc.VBn9tEp6B6e', 'Test', 'Instructor', 'instructor', true, true, 5, 500, 4),
('instructor@modulus.com', '$2b$10$rZ9OQ8YgJBYn8YBCLhc8G.xQw4zKm8XL1YqGQOsGc.VBn9tEp6B6e', 'Modulus', 'Instructor', 'instructor', true, true, 5, 500, 2),

('staff@test.com', '$2b$10$rZ9OQ8YgJBYn8YBCLhc8G.xQw4zKm8XL1YqGQOsGc.VBn9tEp6B6e', 'Test', 'Staff', 'staff', true, true, 7, 750, 6),
('staff@modulus.com', '$2b$10$rZ9OQ8YgJBYn8YBCLhc8G.xQw4zKm8XL1YqGQOsGc.VBn9tEp6B6e', 'Modulus', 'Staff', 'staff', true, true, 7, 750, 1),
('staffuser@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Staff', 'User', 'staff', true, true, 7, 750, 0),

('student@test.com', '$2b$10$rZ9OQ8YgJBYn8YBCLhc8G.xQw4zKm8XL1YqGQOsGc.VBn9tEp6B6e', 'Test', 'Student', 'student', true, true, 1, 100, 3),
('student@modulus.com', '$2b$10$rZ9OQ8YgJBYn8YBCLhc8G.xQw4zKm8XL1YqGQOsGc.VBn9tEp6B6e', 'Modulus', 'Student', 'student', true, true, 1, 100, 1);

-- Insert sample courses
INSERT INTO courses (title, description, instructor_id, is_active) VALUES
('Web Development Fundamentals', 'Comprehensive introduction to HTML, CSS, and JavaScript for building modern web applications', 4, true),
('Cybersecurity Essentials', 'Learn fundamental cybersecurity principles, threat analysis, and security best practices', 4, true),
('Database Design & Management', 'Relational database design, SQL programming, and database administration fundamentals', 5, true),
('System Administration', 'Linux system administration, server management, and DevOps fundamentals', 5, true),
('Python Programming', 'Learn Python programming from basics to advanced concepts with practical projects', 4, true),
('Network Security', 'Advanced network security concepts, penetration testing, and incident response', 5, true);

-- Insert sample labs
INSERT INTO labs (title, description, course_id, difficulty_level, estimated_duration, is_active) VALUES
-- Web Development Course Labs
('HTML Basics', 'Learn HTML structure, semantic elements, and basic document formatting', 1, 1, 60, true),
('CSS Styling & Layout', 'Master CSS selectors, box model, flexbox, and responsive design principles', 1, 2, 90, true),
('JavaScript Fundamentals', 'Variables, functions, DOM manipulation, and event handling in JavaScript', 1, 3, 120, true),
('Responsive Web Design', 'Build mobile-friendly websites using CSS Grid, Flexbox, and media queries', 1, 4, 150, true),

-- Cybersecurity Course Labs
('Network Security Analysis', 'Analyze network traffic, identify threats, and implement security measures', 2, 5, 180, true),
('Vulnerability Assessment', 'Conduct security assessments and penetration testing using industry tools', 2, 7, 240, true),
('Incident Response', 'Learn incident response procedures and forensic analysis techniques', 2, 6, 200, true),

-- Database Course Labs
('SQL Fundamentals', 'Basic SQL queries, joins, and data manipulation techniques', 3, 3, 90, true),
('Advanced SQL Queries', 'Complex queries, stored procedures, and database optimization', 3, 5, 150, true),
('Database Design Project', 'Design and implement a complete database system for a real-world scenario', 3, 6, 300, true),

-- System Administration Labs
('Linux Command Line Mastery', 'Essential Linux commands, file system navigation, and shell scripting', 4, 2, 75, true),
('Server Configuration', 'Set up and configure web servers, databases, and system services', 4, 4, 180, true),
('System Monitoring & Automation', 'Implement monitoring solutions and automate system administration tasks', 4, 6, 240, true),

-- Python Programming Labs
('Python Basics', 'Variables, data types, control structures, and basic programming concepts', 5, 1, 60, true),
('Object-Oriented Programming', 'Classes, objects, inheritance, and advanced OOP concepts in Python', 5, 4, 120, true),
('Web Development with Flask', 'Build web applications using Python Flask framework', 5, 5, 180, true),

-- Network Security Labs
('Penetration Testing Lab', 'Hands-on penetration testing using Kali Linux and security tools', 6, 8, 360, true),
('Malware Analysis', 'Analyze malware samples in a controlled environment', 6, 9, 300, true),
('Security Automation', 'Automate security tasks using Python and security frameworks', 6, 7, 240, true);

-- Insert sample enrollments
INSERT INTO enrollments (user_id, course_id, progress, completed_labs, total_labs, enrolled_at) VALUES
-- Student enrollments
(9, 1, 75.00, 3, 4, '2025-07-10 09:00:00'),  -- Web Development (75% complete)
(9, 2, 33.33, 1, 3, '2025-07-12 14:30:00'),  -- Cybersecurity (33% complete)
(9, 3, 100.00, 3, 3, '2025-07-05 11:00:00'), -- Database (100% complete)
(9, 5, 66.67, 2, 3, '2025-07-08 16:00:00'),  -- Python Programming (67% complete)

(10, 1, 50.00, 2, 4, '2025-07-11 10:00:00'), -- Web Development (50% complete)
(10, 4, 33.33, 1, 3, '2025-07-13 13:00:00'); -- System Administration (33% complete)

-- Insert sample lab sessions
INSERT INTO lab_sessions (user_id, lab_id, status, start_time, end_time, duration_minutes, score, notes) VALUES
-- Completed sessions for student@test.com (user_id: 9)
(9, 1, 'completed', '2025-07-10 09:00:00', '2025-07-10 10:15:00', 75, 95.50, 'Excellent understanding of HTML structure'),
(9, 2, 'completed', '2025-07-10 14:00:00', '2025-07-10 15:45:00', 105, 88.75, 'Good grasp of CSS concepts, minor issues with flexbox'),
(9, 3, 'completed', '2025-07-11 10:00:00', '2025-07-11 12:30:00', 150, 92.00, 'Strong JavaScript fundamentals, creative DOM manipulation'),
(9, 5, 'completed', '2025-07-12 15:00:00', '2025-07-12 18:00:00', 180, 78.25, 'Good network analysis skills, needs practice with advanced tools'),

-- Database course completions
(9, 8, 'completed', '2025-07-05 11:00:00', '2025-07-05 12:30:00', 90, 94.00, 'Excellent SQL query skills'),
(9, 9, 'completed', '2025-07-06 13:00:00', '2025-07-06 15:30:00', 150, 89.50, 'Good understanding of advanced SQL concepts'),
(9, 10, 'completed', '2025-07-07 09:00:00', '2025-07-07 14:00:00', 300, 96.75, 'Outstanding database design project, well-structured schema'),

-- Python course progress
(9, 14, 'completed', '2025-07-08 16:00:00', '2025-07-08 17:00:00', 60, 98.00, 'Perfect understanding of Python basics'),
(9, 15, 'completed', '2025-07-09 10:00:00', '2025-07-09 12:00:00', 120, 91.25, 'Strong OOP concepts, good code organization'),

-- In-progress and planned sessions
(9, 4, 'in_progress', '2025-07-18 09:00:00', NULL, NULL, NULL, NULL),
(9, 16, 'not_started', NULL, NULL, NULL, NULL, NULL),

-- Sessions for student@modulus.com (user_id: 10)
(10, 1, 'completed', '2025-07-11 10:00:00', '2025-07-11 11:30:00', 90, 85.00, 'Good HTML understanding, needs practice with semantic elements'),
(10, 2, 'completed', '2025-07-11 14:00:00', '2025-07-11 16:00:00', 120, 79.50, 'CSS basics understood, struggling with responsive design'),
(10, 11, 'completed', '2025-07-13 13:00:00', '2025-07-13 14:15:00', 75, 88.00, 'Strong Linux command skills'),

-- Failed attempts (for realistic data)
(10, 3, 'failed', '2025-07-12 15:00:00', '2025-07-12 16:30:00', 90, 45.00, 'Needs more practice with JavaScript concepts before retrying');

-- Verify data insertion
SELECT 'Test data inserted successfully!' as message;

-- Display summary statistics
SELECT 
    'Users created: ' || COUNT(*) as summary 
FROM users
UNION ALL
SELECT 
    'Courses created: ' || COUNT(*) 
FROM courses
UNION ALL
SELECT 
    'Labs created: ' || COUNT(*) 
FROM labs
UNION ALL
SELECT 
    'Enrollments created: ' || COUNT(*) 
FROM enrollments
UNION ALL
SELECT 
    'Lab sessions created: ' || COUNT(*) 
FROM lab_sessions;
