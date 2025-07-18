const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'modulus',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function addIconPathColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Adding icon_path column to labs table...');
    
    // Check if icon_path column exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'labs' AND column_name = 'icon_path'
    `);

    if (checkColumn.rows.length === 0) {
      // Add icon_path column
      await client.query(`ALTER TABLE labs ADD COLUMN icon_path VARCHAR(500)`);
      console.log('✅ Added icon_path column');
    } else {
      console.log('ℹ️ icon_path column already exists');
    }

    // Check current columns
    const columns = await client.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'labs' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nCurrent labs table columns:');
    columns.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addIconPathColumn();
