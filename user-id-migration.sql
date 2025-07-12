-- SQL script to update user ID system with role-based ranges
-- Run this on the production database to implement role-based user IDs

-- First, let's check the current users and their IDs
SELECT 
    id, 
    email, 
    name, 
    role,
    CASE 
        WHEN role = 'admin' AND id BETWEEN 1 AND 99 THEN 'Correct Range'
        WHEN role = 'staff' AND id BETWEEN 100 AND 499 THEN 'Correct Range'
        WHEN role = 'instructor' AND id BETWEEN 500 AND 999 THEN 'Correct Range'
        WHEN role = 'student' AND id BETWEEN 1000 AND 4999 THEN 'Correct Range'
        ELSE 'NEEDS MIGRATION'
    END as id_status
FROM users 
ORDER BY role, id;

-- Create a temporary table to map old IDs to new IDs
CREATE TEMPORARY TABLE user_id_mapping (
    old_id INTEGER,
    new_id INTEGER,
    email VARCHAR(255),
    role VARCHAR(50)
);

-- Function to find next available ID in a range
-- This will be implemented in the application, but here's the logic:

-- For existing users that need ID migration:
-- 1. Admin users (role='admin'): Move to range 1-99
-- 2. Staff users (role='staff'): Move to range 100-499  
-- 3. Instructor users (role='instructor'): Move to range 500-999
-- 4. Student users (role='student'): Move to range 1000-4999

-- Step 1: Backup existing users table
CREATE TABLE users_backup AS SELECT * FROM users;

-- Step 2: For demonstration, let's see what migrations would be needed
WITH role_ranges AS (
    SELECT 
        'admin' as role, 1 as min_id, 99 as max_id
    UNION ALL
    SELECT 'staff', 100, 499
    UNION ALL  
    SELECT 'instructor', 500, 999
    UNION ALL
    SELECT 'student', 1000, 4999
),
users_needing_migration AS (
    SELECT 
        u.id as old_id,
        u.email,
        u.role,
        r.min_id,
        r.max_id,
        CASE 
            WHEN u.id BETWEEN r.min_id AND r.max_id THEN false
            ELSE true
        END as needs_migration
    FROM users u
    JOIN role_ranges r ON u.role = r.role
)
SELECT 
    old_id,
    email,
    role,
    min_id,
    max_id,
    needs_migration
FROM users_needing_migration
WHERE needs_migration = true
ORDER BY role, old_id;

-- Note: The actual ID migration will be handled by the application
-- to ensure referential integrity and proper ID assignment

-- Add constraints to enforce ID ranges (optional, for future inserts)
-- These can be added after migration is complete:

-- ALTER TABLE users ADD CONSTRAINT check_admin_id_range 
--     CHECK (role != 'admin' OR (id >= 1 AND id <= 99));

-- ALTER TABLE users ADD CONSTRAINT check_staff_id_range 
--     CHECK (role != 'staff' OR (id >= 100 AND id <= 499));

-- ALTER TABLE users ADD CONSTRAINT check_instructor_id_range 
--     CHECK (role != 'instructor' OR (id >= 500 AND id <= 999));

-- ALTER TABLE users ADD CONSTRAINT check_student_id_range 
--     CHECK (role != 'student' OR (id >= 1000 AND id <= 4999));

-- Show final verification query
SELECT 
    'Role-based ID Ranges Implementation' as status,
    'Use the application endpoints to migrate existing users' as next_step,
    'New registrations will automatically use correct ID ranges' as note;
