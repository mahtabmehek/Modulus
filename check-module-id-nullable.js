const { pool } = require('./backend/db');

(async () => {
  try {
    const result = await pool.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'labs' AND column_name = 'module_id'
    `);
    console.log('module_id column info:', result.rows);
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();
