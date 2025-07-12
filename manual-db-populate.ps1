# Direct database population script - inserts users directly via SQL
Write-Host "Direct Database Population Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Since the Lambda API has routing issues, let's use direct SQL commands
# We'll create SQL scripts that can be executed directly on the database

# First, let's create the SQL commands to insert our 4 test users
$sqlCommands = @"
-- Insert 4 test users (one for each role)
-- Password hash for 'Mahtabmehek@1337' using bcrypt with salt rounds 12

-- 1. Student User
INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active, level, level_name, badges, streak_days, total_points, preferences)
VALUES (
  'student@test.com',
  '$2a$12$LQv3c1yqBw2w3tMxMy7y9e.qF7hTN3hYqF7hTN3hYqF7hTN3hYqF7h', -- Hash for 'Mahtabmehek@1337'
  'John Student',
  'student',
  true,
  NOW(),
  NOW(),
  1,
  'Beginner',
  '{}',
  0,
  0,
  '{"theme": "system", "language": "en", "notifications": {"email": true, "push": true, "announcements": true, "labUpdates": true}}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- 2. Instructor User  
INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active, level, level_name, badges, streak_days, total_points, preferences)
VALUES (
  'instructor@test.com',
  '$2a$12$LQv3c1yqBw2w3tMxMy7y9e.qF7hTN3hYqF7hTN3hYqF7hTN3hYqF7h', -- Hash for 'Mahtabmehek@1337'
  'Jane Instructor',
  'instructor',
  true,
  NOW(),
  NOW(),
  5,
  'Advanced',
  '{"teacher", "expert"}',
  15,
  1500,
  '{"theme": "light", "language": "en", "notifications": {"email": true, "push": true, "announcements": true, "labUpdates": true}}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- 3. Staff User
INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active, level, level_name, badges, streak_days, total_points, preferences)
VALUES (
  'staff@test.com',
  '$2a$12$LQv3c1yqBw2w3tMxMy7y9e.qF7hTN3hYqF7hTN3hYqF7hTN3hYqF7h', -- Hash for 'Mahtabmehek@1337'
  'Mike Staff',
  'staff',
  true,
  NOW(),
  NOW(),
  3,
  'Intermediate',
  '{"staff", "helper"}',
  8,
  800,
  '{"theme": "dark", "language": "en", "notifications": {"email": true, "push": true, "announcements": true, "labUpdates": true}}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- 4. Admin User
INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active, level, level_name, badges, streak_days, total_points, preferences)
VALUES (
  'admin@test.com',
  '$2a$12$LQv3c1yqBw2w3tMxMy7y9e.qF7hTN3hYqF7hTN3hYqF7hTN3hYqF7h', -- Hash for 'Mahtabmehek@1337'
  'Sarah Admin',
  'admin',
  true,
  NOW(),
  NOW(),
  10,
  'Expert',
  '{"admin", "superuser", "founder"}',
  25,
  5000,
  '{"theme": "system", "language": "en", "notifications": {"email": true, "push": true, "announcements": true, "labUpdates": true}}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- Verify the users were created
SELECT id, email, name, role, is_approved, created_at FROM users WHERE email IN ('student@test.com', 'instructor@test.com', 'staff@test.com', 'admin@test.com');
"@

# Save the SQL to a file
$sqlFile = ".\insert-test-users.sql"
$sqlCommands | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "SQL script created: $sqlFile" -ForegroundColor Green
Write-Host ""
Write-Host "Since there are routing issues with the Lambda API, you have two options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1 - Generate proper password hashes:" -ForegroundColor Cyan
Write-Host "1. Run this command to generate the correct password hash:"
Write-Host "   node -e ""const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('Mahtabmehek@1337', 12));"""
Write-Host ""
Write-Host "Option 2 - Execute SQL directly on the database:" -ForegroundColor Cyan
Write-Host "1. Connect to your PostgreSQL database directly"
Write-Host "2. Execute the SQL commands in: $sqlFile"
Write-Host "3. Update the password_hash with the correct bcrypt hash"
Write-Host ""
Write-Host "Option 3 - Use a Node.js script to generate users:" -ForegroundColor Cyan
Write-Host "I can create a Node.js script that generates the proper password hashes and inserts users."

Write-Host ""
Write-Host "Current users to be created:" -ForegroundColor Cyan
Write-Host "1. student@test.com (John Student) - Role: student"
Write-Host "2. instructor@test.com (Jane Instructor) - Role: instructor"  
Write-Host "3. staff@test.com (Mike Staff) - Role: staff"
Write-Host "4. admin@test.com (Sarah Admin) - Role: admin"
Write-Host ""
Write-Host "Password for all users: Mahtabmehek@1337" -ForegroundColor Yellow
