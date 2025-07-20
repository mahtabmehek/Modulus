const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'modulus-lms-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  console.log('🔍 AUTH MIDDLEWARE DEBUG:');
  console.log('- Request path:', req.path);
  console.log('- Request method:', req.method);

  const authHeader = req.headers['authorization'];
  console.log('- Auth header:', authHeader ? 'Present' : 'Missing');

  const token = authHeader && authHeader.split(' ')[1];
  console.log('- Token extracted:', token ? 'Yes' : 'No');

  if (!token) {
    console.log('❌ AUTH FAILED: No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ AUTH FAILED: Token verification error:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    console.log('✅ AUTH SUCCESS: User decoded:', {
      id: user.id,
      userId: user.userId,
      role: user.role,
      email: user.email
    });
    req.user = user;
    next();
  });
};

// GET /api/achievements - Get all available achievements
router.get('/', async (req, res) => {
  try {
    console.log('🎯 ACHIEVEMENTS - GET / called');
    const db = pool;

    const achievementsQuery = `
      SELECT 
        a.*,
        ac.name as category_name,
        ac.icon as category_icon
      FROM achievements a
      LEFT JOIN achievement_categories ac ON a.category = ac.category_key
      WHERE a.is_active = TRUE
      ORDER BY ac.sort_order, a.unlock_order, a.points ASC
    `;

    const result = await db.query(achievementsQuery);
    console.log('🎯 ACHIEVEMENTS - Found', result.rows.length, 'achievements');

    res.json({
      success: true,
      data: {
        achievements: result.rows
      }
    });

  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      error: 'Failed to fetch achievements',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/achievements/user/:userId - Get user's achievements (auth required)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const db = pool;
    const { userId } = req.params;
    const requestingUserId = req.user.userId;

    // Users can only view their own achievements unless they're admin/instructor
    if (parseInt(userId) !== requestingUserId && !['admin', 'instructor', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Get user's earned achievements
    const userAchievementsQuery = `
      SELECT 
        a.*,
        ua.earned_at,
        ua.progress_value,
        ua.is_completed,
        ac.name as category_name,
        ac.icon as category_icon
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
      LEFT JOIN achievement_categories ac ON a.category = ac.category_key
      WHERE a.is_active = TRUE
      ORDER BY 
        ua.is_completed DESC NULLS LAST,
        ac.sort_order, 
        a.unlock_order, 
        a.points ASC
    `;

    const result = await db.query(userAchievementsQuery, [userId]);

    // Get user statistics
    const statsQuery = `
      SELECT us.*, u.level, u.level_name, u.total_points, u.streak_days
      FROM user_statistics us
      RIGHT JOIN users u ON us.user_id = u.id
      WHERE u.id = $1
    `;

    const statsResult = await db.query(statsQuery, [userId]);
    const userStats = statsResult.rows[0];

    // Calculate achievements summary
    const earnedAchievements = result.rows.filter(a => a.is_completed);
    const totalPoints = earnedAchievements.reduce((sum, a) => sum + a.points, 0);

    res.json({
      success: true,
      data: {
        achievements: result.rows,
        userStats: userStats,
        summary: {
          totalAchievements: result.rows.length,
          earnedAchievements: earnedAchievements.length,
          totalPointsFromAchievements: totalPoints,
          completionPercentage: Math.round((earnedAchievements.length / result.rows.length) * 100)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({
      error: 'Failed to fetch user achievements',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/achievements/my - Get current user's achievements
router.get('/my', authenticateToken, async (req, res) => {
  try {
    console.log('🎯 MY ACHIEVEMENTS - Called for user:', req.user.userId || req.user.id);
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      console.log('❌ MY ACHIEVEMENTS - No user ID in token');
      return res.status(400).json({ error: 'User ID not found in token' });
    }

    const db = pool;

    // Get user's earned achievements
    const userAchievementsQuery = `
      SELECT 
        a.*,
        ua.earned_at,
        ua.progress_value,
        ua.id as user_achievement_id,
        ac.name as category_name,
        ac.icon as category_icon,
        CASE WHEN ua.id IS NOT NULL THEN TRUE ELSE FALSE END as is_completed
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
      LEFT JOIN achievement_categories ac ON a.category = ac.category_key
      WHERE a.is_active = TRUE
      ORDER BY ac.sort_order, a.unlock_order, a.points ASC
    `;

    const userStatsQuery = `
      SELECT 
        uas.*,
        u.level,
        u.level_name,
        u.total_points,
        u.streak_days
      FROM user_achievement_stats uas
      JOIN users u ON uas.user_id = u.id
      WHERE uas.user_id = $1
    `;

    console.log('🎯 MY ACHIEVEMENTS - Executing queries for user:', userId);
    const achievements = await db.query(userAchievementsQuery, [userId]);
    console.log('🎯 MY ACHIEVEMENTS - Found', achievements.rows.length, 'achievements');

    const stats = await db.query(userStatsQuery, [userId]);
    console.log('🎯 MY ACHIEVEMENTS - Found user stats:', stats.rows.length > 0);

    const userStats = stats.rows[0] || {};
    const earnedAchievements = achievements.rows.filter(a => a.is_completed);
    const totalPointsFromAchievements = earnedAchievements.reduce((sum, a) => sum + (a.points || 0), 0);

    console.log('🎯 MY ACHIEVEMENTS - Returning data successfully');
    res.json({
      success: true,
      data: {
        achievements: achievements.rows,
        userStats: userStats,
        summary: {
          totalAchievements: achievements.rows.length,
          earnedAchievements: earnedAchievements.length,
          totalPointsFromAchievements: totalPointsFromAchievements,
          completionPercentage: achievements.rows.length > 0 ?
            Math.round((earnedAchievements.length / achievements.rows.length) * 100) : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching my achievements:', error);
    res.status(500).json({
      error: 'Failed to fetch achievements',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/achievements/check/:userId - Manually check and award achievements
router.post('/check/:userId', authenticateToken, async (req, res) => {
  try {
    const db = pool;
    const { userId } = req.params;
    const requestingUserId = req.user.userId;

    // Users can only check their own achievements unless they're admin/instructor
    if (parseInt(userId) !== requestingUserId && !['admin', 'instructor', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Update user streak first
    await db.query('SELECT update_user_streak($1)', [userId]);

    // Check and award achievements
    const result = await db.query('SELECT * FROM check_and_award_achievements($1)', [userId]);
    const newAchievements = result.rows;

    res.json({
      success: true,
      data: {
        newAchievements: newAchievements,
        message: newAchievements.length > 0
          ? `Congratulations! You earned ${newAchievements.length} new achievement(s)!`
          : 'No new achievements at this time. Keep up the great work!'
      }
    });

  } catch (error) {
    console.error('Error checking achievements:', error);
    res.status(500).json({
      error: 'Failed to check achievements',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/achievements/check/me - Check achievements for current user
router.post('/check/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      console.log('❌ USER ID MISSING from token:', req.user);
      return res.status(400).json({ error: 'User ID not found in token' });
    }

    console.log('🏆 CHECKING ACHIEVEMENTS for user:', userId);

    const db = pool;

    // Check and award achievements
    const result = await db.query('SELECT * FROM check_and_award_achievements($1)', [userId]);

    console.log('🏆 ACHIEVEMENT CHECK RESULT:', result.rows);

    res.json({
      success: true,
      data: {
        newAchievements: result.rows || [],
        message: result.rows.length > 0 ?
          `Awarded ${result.rows.length} new achievement(s)!` :
          'No new achievements at this time.'
      }
    });
  } catch (error) {
    console.error('Error checking achievements for current user:', error);
    res.status(500).json({
      error: 'Failed to check achievements',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/achievements/categories - Get achievement categories
router.get('/categories', async (req, res) => {
  try {
    const db = pool;

    const categoriesQuery = `
      SELECT 
        ac.*,
        COUNT(a.id) as achievement_count
      FROM achievement_categories ac
      LEFT JOIN achievements a ON ac.category_key = a.category AND a.is_active = TRUE
      GROUP BY ac.id, ac.category_key, ac.name, ac.description, ac.icon, ac.sort_order
      ORDER BY ac.sort_order
    `;

    const result = await db.query(categoriesQuery);

    res.json({
      success: true,
      data: {
        categories: result.rows
      }
    });

  } catch (error) {
    console.error('Error fetching achievement categories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/achievements/leaderboard - Get achievements leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const db = pool;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category || 'all';

    let leaderboardQuery = `
      SELECT 
        u.id,
        u.name,
        u.level,
        u.level_name,
        u.total_points,
        u.streak_days,
        COUNT(ua.id) as achievements_earned,
        COALESCE(SUM(a.points), 0) as achievement_points
      FROM users u
      LEFT JOIN user_achievements ua ON u.id = ua.user_id AND ua.is_completed = TRUE
      LEFT JOIN achievements a ON ua.achievement_id = a.id
      WHERE u.role = 'student' AND u.is_approved = TRUE
    `;

    if (category !== 'all') {
      leaderboardQuery += ` AND (a.category = $2 OR a.category IS NULL)`;
    }

    leaderboardQuery += `
      GROUP BY u.id, u.name, u.level, u.level_name, u.total_points, u.streak_days
      ORDER BY achievement_points DESC, achievements_earned DESC, u.total_points DESC
      LIMIT $1
    `;

    const params = category !== 'all' ? [limit, category] : [limit];
    const result = await db.query(leaderboardQuery, params);

    res.json({
      success: true,
      data: {
        leaderboard: result.rows.map((row, index) => ({
          ...row,
          rank: index + 1
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      error: 'Failed to fetch leaderboard',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin Routes (for managing achievements)

// POST /api/achievements - Create new achievement (admin/instructor only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 ACHIEVEMENT CREATION DEBUG:');
    console.log('- User role:', req.user.role);
    console.log('- User ID:', req.user.id);
    console.log('- User username:', req.user.username);
    console.log('- Allowed roles:', ['admin', 'instructor']);
    console.log('- Role check result:', ['admin', 'instructor'].includes(req.user.role));

    if (!['admin', 'instructor'].includes(req.user.role)) {
      console.log('❌ PERMISSION DENIED: Role not in allowed list');
      return res.status(403).json({ error: 'Admin or instructor access required' });
    }

    const db = pool;
    const {
      achievement_key,
      name,
      description,
      icon,
      category,
      rarity,
      points,
      criteria,
      is_hidden
    } = req.body;

    const result = await db.query(`
      INSERT INTO achievements (achievement_key, name, description, icon, category, rarity, points, criteria, is_hidden)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [achievement_key, name, description, icon, category, rarity, points, JSON.stringify(criteria), is_hidden || false]);

    res.json({
      success: true,
      data: {
        achievement: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Error creating achievement:', error);
    res.status(500).json({
      error: 'Failed to create achievement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/achievements/:achievementId - Update achievement (admin only)
router.put('/:achievementId', authenticateToken, async (req, res) => {
  try {
    if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const db = pool;
    const { achievementId } = req.params;
    const {
      name,
      description,
      icon,
      category,
      rarity,
      points,
      criteria,
      is_active,
      is_hidden
    } = req.body;

    const result = await db.query(`
      UPDATE achievements 
      SET name = $1, description = $2, icon = $3, category = $4, rarity = $5, 
          points = $6, criteria = $7, is_active = $8, is_hidden = $9, updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `, [name, description, icon, category, rarity, points, JSON.stringify(criteria), is_active, is_hidden, achievementId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    res.json({
      success: true,
      data: {
        achievement: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Error updating achievement:', error);
    res.status(500).json({
      error: 'Failed to update achievement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
