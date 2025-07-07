const express = require('express');
const router = express.Router();

// GET /health
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Modulus LMS Backend is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// GET /health/db
router.get('/db', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const start = Date.now();
    
    // Test database connection with a simple query
    const result = await db.query('SELECT NOW() as current_time, version() as db_version');
    const responseTime = Date.now() - start;
    
    res.json({
      status: 'healthy',
      message: 'Database connection successful',
      database: {
        connected: true,
        responseTime: `${responseTime}ms`,
        currentTime: result.rows[0].current_time,
        version: result.rows[0].db_version
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to check if users table exists
router.get('/debug/tables', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Check if users table exists
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `);
    
    const usersTableExists = tablesResult.rows.length > 0;
    
    // If users table exists, get its structure
    let tableStructure = null;
    if (usersTableExists) {
      const structureResult = await db.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users'
        ORDER BY ordinal_position
      `);
      tableStructure = structureResult.rows;
    }
    
    // Get all tables in the database
    const allTablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    res.json({
      status: 'success',
      database: {
        connected: true,
        usersTableExists,
        tableStructure,
        allTables: allTablesResult.rows.map(row => row.table_name)
      }
    });
    
  } catch (error) {
    console.error('Debug tables error:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});

// One-time schema initialization endpoint
router.post('/init-schema', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const fs = require('fs');
    const path = require('path');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return res.status(500).json({ 
        status: 'error',
        error: 'Schema file not found' 
      });
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await db.query(schemaSQL);
    
    // Verify tables were created
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    res.json({
      status: 'success',
      message: 'Database schema initialized successfully',
      tablesCreated: tablesResult.rows.map(row => row.table_name)
    });
    
  } catch (error) {
    console.error('Schema initialization error:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});

module.exports = router;
