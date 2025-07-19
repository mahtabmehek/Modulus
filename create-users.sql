-- Insert 14 users into the database
-- 10 students, 2 instructors, 2 staff
-- All with password 'password123' (hashed: $2a$12$3Tkig2oEUac4nTwxOoL4s.jLNja7uPu27MWD11SWqV0Gg2tQx4f0e)

-- 10 Student Users
INSERT INTO users (name, email, password_hash, role, course_code, is_approved) VALUES 
('John Smith', 'john.smith@example.com', '$2a$12$3Tkig2oEUac4nTwxOoL4s.jLNja7uPu27MWD11SWqV0Gg2tQx4f0e', 'student', NULL, true),
('Sarah Johnson', 'sarah.johnson@example.com', '$2a$12$3Tkig2oEUac4nTwxOoL4s.jLNja7uPu27MWD11SWqV0Gg2tQx4f0e', 'student', NULL, true),
('Michael Brown', 'michael.brown@example.com', '$2a$12$3Tkig2oEUac4nTwxOoL4s.jLNja7uPu27MWD11SWqV0Gg2tQx4f0e', 'student', NULL, true),
('Emily Davis', 'emily.davis@example.com', '$2a$12$3Tkig2oEUac4nTwxOoL4s.jLNja7uPu27MWD11SWqV0Gg2tQx4f0e', 'student', NULL, true),
('David Wilson', 'david.wilson@example.com', '$2a$12$3Tkig2oEUac4nTwxOoL4s.jLNja7uPu27MWD11SWqV0Gg2tQx4f0e', 'student', NULL, true),
('Jessica Moore', 'jessica.moore@example.com', '$2a$12$3Tkig2oEUac4nTwxOoL4s.jLNja7uPu27MWD11SWqV0Gg2tQx4f0e', 'student', NULL, true),
('James Taylor', 'james.taylor@example.com', '$2a$12$3Tkig2oEUac4nTwxOoL4s.jLNja7uPu27MWD11SWqV0Gg2tQx4f0e', 'student', NULL, true),
('Ashley Anderson', 'ashley.anderson@example.com', '$2a$12$3Tkig2oEUac4nTwxOoL4s.jLNja7uPu27MWD11SWqV0Gg2tQx4f0e', 'student', NULL, true),
('Christopher Thomas', 'christopher.thomas@example.com', '$2a$12$3Tkig2oEUac4nTwxOoL4s.jLNja7uPu27MWD11SWqV0Gg2tQx4f0e', 'student', NULL, true),
('Amanda Jackson', 'amanda.jackson@example.com', '$2a$12$3Tkig2oEUac4nTwxOoL4s.jLNja7uPu27MWD11SWqV0Gg2tQx4f0e', 'student', NULL, true),

-- 2 Instructor Users
('Robert Williams', 'robert.williams@example.com', '$2a$12$3Tkig2oEUac4nTwxOoL4s.jLNja7uPu27MWD11SWqV0Gg2tQx4f0e', 'instructor', NULL, true),
('Lisa Miller', 'lisa.miller@example.com', '$2a$12$3Tkig2oEUac4nTwxOoL4s.jLNja7uPu27MWD11SWqV0Gg2tQx4f0e', 'instructor', NULL, true),

-- 2 Staff Users
('Kevin Garcia', 'kevin.garcia@example.com', '$2a$12$3Tkig2oEUac4nTwxOoL4s.jLNja7uPu27MWD11SWqV0Gg2tQx4f0e', 'staff', NULL, true),
('Michelle Rodriguez', 'michelle.rodriguez@example.com', '$2a$12$3Tkig2oEUac4nTwxOoL4s.jLNja7uPu27MWD11SWqV0Gg2tQx4f0e', 'staff', NULL, true);

-- Display the created users
SELECT id, name, email, role, is_approved FROM users WHERE email LIKE '%@example.com' ORDER BY role, id;
