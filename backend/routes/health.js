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

// GET /health/db-indexes
router.get('/db-indexes', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Get table structure
    const tables = await db.query(`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position
    `);
    
    // Get indexes
    const indexes = await db.query(`
      SELECT 
        t.relname as table_name,
        i.relname as index_name,
        a.attname as column_name,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary
      FROM 
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_attribute a
      WHERE 
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND t.relname NOT LIKE 'pg_%'
      ORDER BY t.relname, i.relname;
    `);
    
    // Get table statistics
    const stats = await db.query(`
      SELECT 
        schemaname,
        tablename,
        attname as column_name,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      ORDER BY tablename, attname;
    `);
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      database_structure: {
        tables: tables.rows,
        indexes: indexes.rows,
        statistics: stats.rows
      }
    });
    
  } catch (error) {
    console.error('Database indexes check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check database indexes',
      error: error.message
    });
  }
});

// POST /health/optimize-indexes
router.post('/optimize-indexes', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const results = [];
    
    const indexes = [
      {
        name: 'idx_users_role',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role)',
        description: 'Index for role-based queries (admin dashboard, user management)'
      },
      {
        name: 'idx_users_is_approved',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_approved ON users(is_approved)',
        description: 'Index for approval status filtering (admin approval workflows)'
      },
      {
        name: 'idx_users_role_approved',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_approved ON users(role, is_approved)',
        description: 'Composite index for role + approval status (efficient for admin queries)'
      },
      {
        name: 'idx_users_created_at',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at)',
        description: 'Index for created_at for sorting and date range queries'
      },
      {
        name: 'idx_users_unapproved',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_unapproved ON users(id) WHERE is_approved = false',
        description: 'Partial index for unapproved users (most queried by admins)'
      }
    ];
    
    for (const index of indexes) {
      try {
        const start = Date.now();
        await db.query(index.sql);
        const duration = Date.now() - start;
        
        results.push({
          index_name: index.name,
          status: 'created',
          description: index.description,
          duration_ms: duration
        });
      } catch (error) {
        results.push({
          index_name: index.name,
          status: 'error',
          description: index.description,
          error: error.message
        });
      }
    }
    
    res.json({
      status: 'completed',
      message: 'Database index optimization completed',
      timestamp: new Date().toISOString(),
      results: results
    });
    
  } catch (error) {
    console.error('Database index optimization error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to optimize database indexes',
      error: error.message
    });
  }
});

module.exports = router;
