const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'modulus',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function addIconPathColumn() {
  try {
    // Check if icon_path column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'labs' AND column_name = 'icon_path'
    `);

    if (checkColumn.rows.length === 0) {
      // Add icon_path column
      await pool.query(`
        ALTER TABLE labs 
        ADD COLUMN icon_path VARCHAR(500)
      `);
      console.log('✅ Added icon_path column to labs table');

      // Copy data from icon_url to icon_path if icon_url exists
      const checkIconUrl = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'labs' AND column_name = 'icon_url'
      `);

      if (checkIconUrl.rows.length > 0) {
        await pool.query(`
          UPDATE labs 
          SET icon_path = icon_url 
          WHERE icon_url IS NOT NULL
        `);
        console.log('✅ Copied data from icon_url to icon_path');
      }
    } else {
      console.log('ℹ️  icon_path column already exists');
    }

    // Show final schema
    const columns = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'labs' AND column_name LIKE '%icon%'
      ORDER BY ordinal_position
    `);
    console.log('Icon-related columns in labs table:');
    console.table(columns.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

addIconPathColumn();
