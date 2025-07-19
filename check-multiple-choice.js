const { pool } = require('./backend/db');

(async () => {
  try {
    // Check column type
    const schemaResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'multiple_choice_options'
    `);
    console.log('Column schema:', schemaResult.rows);

    // Check actual data
    const dataResult = await pool.query(`
      SELECT id, multiple_choice_options, pg_typeof(multiple_choice_options) as data_type
      FROM questions 
      WHERE multiple_choice_options IS NOT NULL 
      LIMIT 3
    `);
    console.log('Sample data:', dataResult.rows);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();
