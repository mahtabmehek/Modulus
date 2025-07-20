-- Database Verification Script
-- Run this to check if your Modulus LMS database is properly configured

\echo 'Modulus LMS Database Verification'
\echo '================================='

-- Check database connection
SELECT 'Connected to database: ' || current_database() as connection_status;

-- Check if all required tables exist
\echo ''
\echo 'Checking table structure...'
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('users', 'user_levels', 'courses', 'labs', 'enrollments', 'lab_sessions') 
        THEN '✅'
        ELSE '❌'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check user levels data
\echo ''
\echo 'User levels configuration:'
SELECT level_number, level_name, min_points, max_points, badge_color FROM user_levels ORDER BY level_number;

-- Check test users
\echo ''
\echo 'Test users verification:'
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    is_approved,
    level_id,
    total_points
FROM users 
WHERE email LIKE '%@test.com' OR email LIKE '%@modulus.com'
ORDER BY role, email;

-- Check courses
\echo ''
\echo 'Available courses:'
SELECT 
    id,
    title,
    instructor_id,
    is_active,
    (SELECT first_name || ' ' || last_name FROM users WHERE id = courses.instructor_id) as instructor_name
FROM courses 
ORDER BY id;

-- Check labs
\echo ''
\echo 'Available labs:'
SELECT 
    l.id,
    l.title,
    c.title as course_title,
    l.difficulty_level,
    l.estimated_duration,
    l.is_active
FROM labs l
JOIN courses c ON l.course_id = c.id
ORDER BY c.id, l.id;

-- Check enrollments
\echo ''
\echo 'Student enrollments:'
SELECT 
    u.email as student_email,
    c.title as course_title,
    e.progress,
    e.completed_labs,
    e.total_labs,
    e.enrolled_at
FROM enrollments e
JOIN users u ON e.user_id = u.id
JOIN courses c ON e.course_id = c.id
ORDER BY u.email, c.title;

-- Check lab sessions
\echo ''
\echo 'Lab session summary:'
SELECT 
    status,
    COUNT(*) as session_count,
    ROUND(AVG(score), 2) as avg_score
FROM lab_sessions 
WHERE score IS NOT NULL
GROUP BY status
ORDER BY status;

-- Database statistics
\echo ''
\echo 'Database statistics:'
SELECT 
    'Total Users' as metric, COUNT(*)::text as value FROM users
UNION ALL
SELECT 'Approved Users', COUNT(*)::text FROM users WHERE is_approved = true
UNION ALL
SELECT 'Total Courses', COUNT(*)::text FROM courses
UNION ALL
SELECT 'Active Courses', COUNT(*)::text FROM courses WHERE is_active = true
UNION ALL
SELECT 'Total Labs', COUNT(*)::text FROM labs
UNION ALL
SELECT 'Active Labs', COUNT(*)::text FROM labs WHERE is_active = true
UNION ALL
SELECT 'Total Enrollments', COUNT(*)::text FROM enrollments
UNION ALL
SELECT 'Completed Lab Sessions', COUNT(*)::text FROM lab_sessions WHERE status = 'completed';

-- Test authentication query (this is what the backend uses)
\echo ''
\echo 'Testing authentication query for admin@test.com:'
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.is_approved,
    u.level_id,
    u.total_points,
    ul.level_name
FROM users u 
LEFT JOIN user_levels ul ON u.level_id = ul.level_number 
WHERE u.email = 'admin@test.com' AND u.is_approved = true;

\echo ''
\echo '✅ Database verification completed!'
\echo 'If you see data above, your database is properly configured.'
