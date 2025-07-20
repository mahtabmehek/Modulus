const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function dropNotificationTable() {
  try {
    console.log('🗑️ Dropping achievement_notifications table...');
    
    await pool.query('DROP TABLE IF EXISTS achievement_notifications CASCADE;');
    
    console.log('✅ Successfully dropped achievement_notifications table');
    
  } catch (error) {
    console.error('❌ Error dropping table:', error.message);
  } finally {
    await pool.end();
  }
}

dropNotificationTable();
