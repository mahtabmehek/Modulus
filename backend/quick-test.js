const { pool } = require('./db');

async function quickTest() {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    
    // Check tables
    const tables = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE tablename IN ('users', 'achievements', 'user_achievement_stats', 'achievement_categories')
      ORDER BY tablename
    `);
    console.log('✅ Tables found:', tables.rows.map(r => r.tablename));
    
    // Check if user 1002 exists
    const user = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [1002]);
    console.log('✅ User 1002:', user.rows[0] || 'Not found');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

quickTest();
