-- Insert 4 test users (one for each role)
-- Password hash for 'Mahtabmehek@1337' using bcrypt with salt rounds 12

-- 1. Student User
INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active, level, level_name, badges, streak_days, total_points, preferences)
VALUES (
  'student@test.com',
  '.qF7hTN3hYqF7hTN3hYqF7hTN3hYqF7h', -- Hash for 'Mahtabmehek@1337'
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
  '.qF7hTN3hYqF7hTN3hYqF7hTN3hYqF7h', -- Hash for 'Mahtabmehek@1337'
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
  '.qF7hTN3hYqF7hTN3hYqF7hTN3hYqF7h', -- Hash for 'Mahtabmehek@1337'
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
  '.qF7hTN3hYqF7hTN3hYqF7hTN3hYqF7h', -- Hash for 'Mahtabmehek@1337'
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
