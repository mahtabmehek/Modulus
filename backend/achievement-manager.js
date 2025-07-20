const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'modulus',
  user: 'postgres',
  password: 'mahtab',
});

/**
 * Award a specific achievement to a user
 * @param {number} userId - The user ID
 * @param {string} achievementKey - The achievement key (e.g., 'first_login', 'lab_completion_1', etc.)
 * @returns {Promise<boolean>} - True if awarded, false if already had it
 */
async function awardAchievement(userId, achievementKey) {
  try {
    // Get achievement details
    const achievementResult = await pool.query(
      'SELECT id, name, description FROM achievements WHERE achievement_key = $1 AND is_active = TRUE',
      [achievementKey]
    );

    if (achievementResult.rows.length === 0) {
      console.log(`❌ Achievement not found: ${achievementKey}`);
      return false;
    }

    const achievement = achievementResult.rows[0];

    // Check if user already has this achievement
    const existingResult = await pool.query(
      'SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
      [userId, achievement.id]
    );

    if (existingResult.rows.length > 0) {
      console.log(`✅ User ${userId} already has achievement: ${achievement.name}`);
      return false;
    }

    // Award the achievement
    await pool.query(
      'INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES ($1, $2, NOW())',
      [userId, achievement.id]
    );

    console.log(`🏆 Awarded "${achievement.name}" to user ${userId}`);
    return true;

  } catch (error) {
    console.error('❌ Error awarding achievement:', error.message);
    return false;
  }
}

/**
 * Check and award all eligible achievements for a user
 * @param {number} userId - The user ID
 */
async function checkAllAchievements(userId) {
  try {
    // Update user streak first
    await pool.query('SELECT update_user_streak($1)', [userId]);
    
    // Check and award achievements
    const result = await pool.query('SELECT * FROM check_and_award_achievements($1)', [userId]);
    const newAchievements = result.rows;

    if (newAchievements.length > 0) {
      console.log(`🎉 Awarded ${newAchievements.length} new achievements to user ${userId}:`);
      newAchievements.forEach(achievement => {
        console.log(`  🏆 ${achievement.name} (${achievement.points} points)`);
      });
    } else {
      console.log(`📊 No new achievements for user ${userId} at this time`);
    }

    return newAchievements;
  } catch (error) {
    console.error('❌ Error checking achievements:', error.message);
    return [];
  }
}

/**
 * List all available achievements
 */
async function listAllAchievements() {
  try {
    const result = await pool.query(`
      SELECT 
        achievement_key,
        name,
        description,
        icon,
        category,
        rarity,
        points,
        criteria
      FROM achievements 
      WHERE is_active = TRUE 
      ORDER BY category, unlock_order
    `);

    console.log('\n📋 Available Achievements:');
    result.rows.forEach(achievement => {
      console.log(`\n🏆 ${achievement.name} (${achievement.achievement_key})`);
      console.log(`   📝 ${achievement.description}`);
      console.log(`   📂 Category: ${achievement.category} | 💎 Rarity: ${achievement.rarity} | ⭐ Points: ${achievement.points}`);
      console.log(`   🎯 Criteria: ${JSON.stringify(achievement.criteria, null, 2)}`);
    });

    return result.rows;
  } catch (error) {
    console.error('❌ Error listing achievements:', error.message);
    return [];
  }
}

/**
 * Get user's achievements
 */
async function getUserAchievements(userId) {
  try {
    const result = await pool.query(`
      SELECT 
        ua.earned_at,
        a.achievement_key,
        a.name,
        a.description,
        a.icon,
        a.points,
        a.rarity,
        a.category
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = $1
      ORDER BY ua.earned_at DESC
    `, [userId]);

    console.log(`\n🎯 User ${userId}'s Achievements (${result.rows.length} total):`);
    result.rows.forEach(achievement => {
      console.log(`  🏆 ${achievement.name} - Earned: ${achievement.earned_at.toLocaleDateString()}`);
    });

    return result.rows;
  } catch (error) {
    console.error('❌ Error getting user achievements:', error.message);
    return [];
  }
}

// Example usage
async function main() {
  console.log('🎮 Achievement Management System\n');

  // List all achievements
  await listAllAchievements();

  // Award a specific achievement to student3 (user ID 1002)
  const userId = 1002;
  console.log(`\n🎯 Testing with user ${userId}:`);
  
  // Check current achievements
  await getUserAchievements(userId);

  // Award first login achievement
  await awardAchievement(userId, 'first_login');

  // Check all possible achievements
  await checkAllAchievements(userId);

  // Check achievements again
  await getUserAchievements(userId);

  await pool.end();
}

// Export functions for use in other scripts
module.exports = {
  awardAchievement,
  checkAllAchievements,
  listAllAchievements,
  getUserAchievements
};

// Run main if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}
