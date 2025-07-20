const { pool } = require('./db');

async function testAchievementsAPI() {
  try {
    console.log('🧪 Testing achievements system...');
    
    // Test 1: Check if user_achievement_stats table exists
    const tableCheck = await pool.query(
      "SELECT tablename FROM pg_tables WHERE tablename = 'user_achievement_stats'"
    );
    console.log('✅ Table exists:', tableCheck.rows.length > 0);
    
    // Test 2: Check if user has stats entry
    const userStats = await pool.query(
      'SELECT * FROM user_achievement_stats WHERE user_id = $1',
      [1002]
    );
    console.log('✅ User stats found:', userStats.rows.length > 0);
    
    if (userStats.rows.length === 0) {
      console.log('📝 Creating stats entry for user 1002...');
      await pool.query(
        'INSERT INTO user_achievement_stats (user_id) VALUES ($1)',
        [1002]
      );
      console.log('✅ Stats entry created');
    }
    
    // Test 3: Check if achievements table exists and has data
    const achievements = await pool.query('SELECT COUNT(*) FROM achievements');
    console.log('✅ Achievements in database:', achievements.rows[0].count);
    
    // Test 4: Test the achievements API query
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
      LIMIT 5
    `;
    
    const testQuery = await pool.query(userAchievementsQuery, [1002]);
    console.log('✅ API query works, returned', testQuery.rows.length, 'achievements');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAchievementsAPI();
