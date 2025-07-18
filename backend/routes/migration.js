const express = require('express');
const router = express.Router();

// Database migration endpoint - should be secured in production
router.post('/migrate-labs-schema', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    
    console.log('Running labs table migration...');
    
    // Add icon_path column if it doesn't exist
    await pool.query(`
      ALTER TABLE labs 
      ADD COLUMN IF NOT EXISTS icon_path VARCHAR(500)
    `);
    
    // Add tags column if it doesn't exist
    await pool.query(`
      ALTER TABLE labs 
      ADD COLUMN IF NOT EXISTS tags TEXT[]
    `);
    
    console.log('Migration completed successfully');
    
    // Check the updated schema
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'labs' 
      ORDER BY ordinal_position
    `);
    
    res.json({
      success: true,
      message: 'Migration completed successfully',
      columns: result.rows
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error.message
    });
  }
});

module.exports = router;
