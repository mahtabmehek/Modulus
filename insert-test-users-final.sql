-- Insert 4 test users (one for each role) with proper bcrypt password hash
-- Password for all users: Mahtabmehek@1337
-- Hash: $2a$12$R/bcvYBpQuDHori9OAtAE.umBcCmsHvW.NuOeEesCvb3dJ8w10rL2

-- 1. Student User
INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) 
VALUES ('student@test.com', '$2a$12$R/bcvYBpQuDHori9OAtAE.umBcCmsHvW.NuOeEesCvb3dJ8w10rL2', 'John Student', 'student', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

-- 2. Instructor User
INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) 
VALUES ('instructor@test.com', '$2a$12$R/bcvYBpQuDHori9OAtAE.umBcCmsHvW.NuOeEesCvb3dJ8w10rL2', 'Jane Instructor', 'instructor', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

-- 3. Staff User
INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) 
VALUES ('staff@test.com', '$2a$12$R/bcvYBpQuDHori9OAtAE.umBcCmsHvW.NuOeEesCvb3dJ8w10rL2', 'Mike Staff', 'staff', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

-- 4. Admin User
INSERT INTO users (email, password_hash, name, role, is_approved, created_at, last_active) 
VALUES ('admin@test.com', '$2a$12$R/bcvYBpQuDHori9OAtAE.umBcCmsHvW.NuOeEesCvb3dJ8w10rL2', 'Sarah Admin', 'admin', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

-- Verify users were created
SELECT id, email, name, role, is_approved, created_at FROM users WHERE email IN ('student@test.com', 'instructor@test.com', 'staff@test.com', 'admin@test.com');
