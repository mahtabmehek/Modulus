-- Seed Test Users for Modulus LMS
-- Password for all users: Mahtabmehek@1337

-- Delete existing test users if they exist
DELETE FROM users WHERE email IN ('student@test.com', 'instructor@test.com', 'admin@test.com', 'student@modulus.com', 'instructor@modulus.com', 'admin@modulus.com');

-- Insert test users with hashed password
-- Password: Mahtabmehek@1337
-- Hash generated with bcrypt, rounds=12: $2a$12$2Ew/ggx2teGdXNRRBj/1aO3ryIcHy3CzU3LZ8kh/iJHQfyXWbA6iq

INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active, level, level_name, total_points) VALUES
-- Test domain users
('student@test.com', '$2a$12$2Ew/ggx2teGdXNRRBj/1aO3ryIcHy3CzU3LZ8kh/iJHQfyXWbA6iq', 'Test Student', 'student', true, NOW(), NOW(), 1, 'Beginner', 0),
('instructor@test.com', '$2a$12$2Ew/ggx2teGdXNRRBj/1aO3ryIcHy3CzU3LZ8kh/iJHQfyXWbA6iq', 'Test Instructor', 'instructor', true, NOW(), NOW(), 5, 'Advanced', 500),
('admin@test.com', '$2a$12$2Ew/ggx2teGdXNRRBj/1aO3ryIcHy3CzU3LZ8kh/iJHQfyXWbA6iq', 'Test Admin', 'admin', true, NOW(), NOW(), 10, 'Expert', 1000),

-- Modulus domain users
('student@modulus.com', '$2a$12$2Ew/ggx2teGdXNRRBj/1aO3ryIcHy3CzU3LZ8kh/iJHQfyXWbA6iq', 'Modulus Student', 'student', true, NOW(), NOW(), 1, 'Beginner', 0),
('instructor@modulus.com', '$2a$12$2Ew/ggx2teGdXNRRBj/1aO3ryIcHy3CzU3LZ8kh/iJHQfyXWbA6iq', 'Modulus Instructor', 'instructor', true, NOW(), NOW(), 5, 'Advanced', 500),
('admin@modulus.com', '$2a$12$2Ew/ggx2teGdXNRRBj/1aO3ryIcHy3CzU3LZ8kh/iJHQfyXWbA6iq', 'Modulus Admin', 'admin', true, NOW(), NOW(), 10, 'Expert', 1000);

-- Verify insertion
SELECT id, email, name, role, is_approved, created_at FROM users WHERE email LIKE '%@test.com' OR email LIKE '%@modulus.com' ORDER BY role, email;
