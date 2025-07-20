const { Client } = require('pg');

async function testAchievements() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'modulus',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('🔌 Connected to database');

    // Find student3 user
    const userResult = await client.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      ['student3@test.com']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ student3@test.com not found');
      return;
    }

    const user = userResult.rows[0];
    console.log(`👤 Found user: ${user.name} (ID: ${user.id})`);

    // Check if user already has the "First Login" achievement
    const achievementResult = await client.query(
      'SELECT id FROM achievements WHERE achievement_key = $1',
      ['first_login']
    );

    if (achievementResult.rows.length === 0) {
      console.log('❌ First Login achievement not found');
      return;
    }

    const achievementId = achievementResult.rows[0].id;

    // Check if user already has this achievement
    const userAchievementResult = await client.query(
      'SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
      [user.id, achievementId]
    );

    if (userAchievementResult.rows.length > 0) {
      console.log('✅ User already has First Login achievement');
    } else {
      // Award the achievement
      await client.query(
        'INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES ($1, $2, NOW())',
        [user.id, achievementId]
      );
      console.log('🏆 Awarded First Login achievement to student3!');
    }

    // Check current user achievements count
    const countResult = await client.query(
      'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1',
      [user.id]
    );
    console.log(`🎯 Total achievements for ${user.name}: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testAchievements();
