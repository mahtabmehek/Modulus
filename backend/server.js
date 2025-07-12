const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

// Initialize connection test
testConnection();

// Root endpoint - list all available endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Modulus API',
    endpoints: [
      'GET /health',
      'GET /api/health', 
      'GET /api/db/tables',
      'GET /api/db/users',
      'GET /api/auth/admin/users',
      'POST /api/auth/login'
    ]
  });
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Database inspection endpoints
app.get('/api/db/tables', async (req, res) => {
  try {
    // Get all table names
    const tableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const tableResult = await pool.query(tableQuery);
    const tableNames = tableResult.rows.map(row => row.table_name);
    
    // Get column info for each table
    const tables = {};
    for (const tableName of tableNames) {
      const columnQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      const columnResult = await pool.query(columnQuery, [tableName]);
      
      // Get row count
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const rowCount = parseInt(countResult.rows[0].count);
      
      tables[tableName] = {
        columns: columnResult.rows,
        rowCount: rowCount
      };
    }
    
    res.json({
      success: true,
      tables: tables,
      tableNames: tableNames
    });
  } catch (error) {
    console.error('Database tables error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all users - for debugging
app.get('/api/db/users', async (req, res) => {
  try {
    const query = `
      SELECT id, email, name, role, is_approved, created_at, last_active
      FROM users 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    
    res.json({
      success: true,
      users: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Database users error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin endpoint to get all users - this is what the frontend expects
app.get('/api/auth/admin/users', async (req, res) => {
  try {
    const query = `
      SELECT id, email, name, role, is_approved, created_at, last_active
      FROM users 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    
    // Format the response to match what the frontend expects
    const formattedUsers = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isApproved: user.is_approved,
      createdAt: user.created_at,
      lastActive: user.last_active,
      department: null // Add default department if needed
    }));
    
    res.json({
      users: formattedUsers
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      users: []
    });
  }
});

// Authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Query database for user
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const user = result.rows[0];
    
    // For now, return user info (in production, verify password hash)
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.is_approved
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
