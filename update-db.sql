-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS department VARCHAR(255),
ADD COLUMN IF NOT EXISTS course_code VARCHAR(100);

-- Verify the structure
\d users;
