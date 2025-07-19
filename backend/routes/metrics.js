const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// Get comprehensive database metrics
router.get('/metrics', async (req, res) => {
    try {
        const db = pool;

        // Get user statistics
        const userStats = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'student' THEN 1 END) as total_students,
        COUNT(CASE WHEN role = 'instructor' THEN 1 END) as total_instructors,
        COUNT(CASE WHEN role = 'staff' THEN 1 END) as total_staff,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
        COUNT(CASE WHEN is_approved = true THEN 1 END) as approved_users,
        COUNT(CASE WHEN is_approved = false THEN 1 END) as pending_approvals,
        COUNT(CASE WHEN last_active > NOW() - INTERVAL '24 hours' THEN 1 END) as active_last_24h,
        COUNT(CASE WHEN last_active > NOW() - INTERVAL '7 days' THEN 1 END) as active_last_7days,
        AVG(total_points)::integer as avg_points,
        MAX(total_points) as max_points,
        AVG(streak_days)::integer as avg_streak
      FROM users
    `);

        // Get top performers
        const topPerformers = await db.query(`
      SELECT 
        name,
        total_points,
        streak_days,
        role,
        level
      FROM users
      WHERE total_points > 0
      ORDER BY total_points DESC
      LIMIT 5
    `);

        // Get level distribution
        const levelStats = await db.query(`
      SELECT 
        level_name,
        level as level_number,
        COUNT(*) as user_count,
        '#purple' as badge_color
      FROM users
      GROUP BY level, level_name
      ORDER BY level
    `);

        // Get recent activity (last 30 days)
        const recentActivity = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users 
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 7
    `);

        res.json({
            users: userStats.rows[0],
            levels: levelStats.rows,
            recentActivity: recentActivity.rows,
            topPerformers: topPerformers.rows,
            // Placeholder data for missing tables
            courses: { total_courses: 0, active_courses: 0, inactive_courses: 0, unique_instructors: 0 },
            labs: { total_labs: 0, active_labs: 0, avg_difficulty: 0, avg_duration_minutes: 0 },
            enrollments: { total_enrollments: 0, avg_progress: 0, completed_courses: 0, avg_completed_labs: 0 },
            sessions: { total_sessions: 0, completed_sessions: 0, active_sessions: 0, failed_sessions: 0, avg_session_duration: 0, avg_score: 0, sessions_today: 0 },
            courseEngagement: [],
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching database metrics:', error);
        res.status(500).json({
            error: 'Failed to fetch metrics',
            message: error.message
        });
    }
});

module.exports = router;
