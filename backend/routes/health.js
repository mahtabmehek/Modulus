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

module.exports = router;
