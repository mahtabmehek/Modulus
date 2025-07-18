-- Database Population Verification Report
-- Generated on July 18, 2025

-- Summary of populated data
SELECT 'COURSES' as category, COUNT(*) as count FROM courses
UNION ALL
SELECT 'MODULES' as category, COUNT(*) as count FROM modules  
UNION ALL
SELECT 'LABS' as category, COUNT(*) as count FROM labs
UNION ALL
SELECT 'USERS' as category, COUNT(*) as count FROM users
UNION ALL
SELECT 'ENROLLMENTS' as category, COUNT(*) as count FROM enrollments
UNION ALL
SELECT 'ANNOUNCEMENTS' as category, COUNT(*) as count FROM announcements
UNION ALL
SELECT 'ACCESS_CODES' as category, COUNT(*) as count FROM access_codes
UNION ALL
SELECT 'USER_PROGRESS' as category, COUNT(*) as count FROM user_progress
ORDER BY category;

-- Detailed course information
SELECT 
    c.id,
    c.title,
    c.code,
    c.department,
    c.difficulty_level,
    c.estimated_hours,
    COUNT(m.id) as modules_count,
    COUNT(l.id) as labs_count
FROM courses c
LEFT JOIN modules m ON c.id = m.course_id
LEFT JOIN labs l ON m.id = l.module_id
GROUP BY c.id, c.title, c.code, c.department, c.difficulty_level, c.estimated_hours
ORDER BY c.id;

-- Active enrollments summary
SELECT 
    c.title as course_title,
    u.name as user_name,
    u.role,
    e.status,
    e.enrolled_at
FROM enrollments e
JOIN courses c ON e.course_id = c.id
JOIN users u ON e.user_id = u.id
WHERE e.status = 'active'
ORDER BY c.title, u.role, u.name;

-- Recent announcements
SELECT 
    title,
    target_audience,
    priority,
    published_at,
    is_pinned
FROM announcements
ORDER BY published_at DESC;

-- User progress overview
SELECT 
    u.name as user_name,
    c.title as course_title,
    up.status,
    up.progress_percentage,
    up.score,
    up.max_score
FROM user_progress up
JOIN users u ON up.user_id = u.id
JOIN courses c ON up.course_id = c.id
ORDER BY u.name, c.title;
