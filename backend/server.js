const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const healthRoutes = require('./routes/health');
const adminRoutes = require('./routes/admin');
const coursesRoutes = require('./routes/courses');
const labsRoutes = require('./routes/labs');
const filesRoutes = require('./routes/files');
const submissionsRoutes = require('./routes/submissions');
const achievementsRoutes = require('./routes/achievements');

// Load desktop routes for local development
let desktopRoutes = null;
try {
  desktopRoutes = require('./routes/desktop');
  console.log('✅ Desktop routes loaded successfully');
} catch (error) {
  console.log('❌ Desktop routes not available:', error.message);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting for local development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased from 100)
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3000',
    'https://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory with proper CORS headers
app.use('/uploads', (req, res, next) => {
  // Set comprehensive CORS headers for static files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}, express.static('uploads', {
  setHeaders: (res, path) => {
    // Ensure proper content types for images
    if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (path.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Database connection - Local PostgreSQL only
console.log('🔌 Connecting to local PostgreSQL database');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'modulus',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: false, // No SSL for local development
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Test database connection
pool.connect()
  .then(client => {
    console.log('✅ Connected to database');
    client.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    console.log('🔄 Falling back to mock database for local development');

    // Use mock database as fallback
    try {
      const MockDatabase = require('./mock-db');
      app.locals.db = new MockDatabase();
      console.log('✅ Mock database initialized');
    } catch (mockErr) {
      console.error('❌ Mock database not available:', mockErr.message);
    }
  });

// Make pool available to routes
app.locals.db = pool;

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/labs', labsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/achievements', achievementsRoutes);

// Only use desktop routes if available
if (desktopRoutes) {
  console.log('🔗 Registering desktop routes at /api/desktop');
  app.use('/api/desktop', desktopRoutes);
} else {
  console.log('⚠️  Desktop routes not registered - desktopRoutes is null');
}

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Root API endpoint
app.get('/api/status', (req, res) => {
  res.json({
    message: 'Modulus LMS Backend API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Modulus Backend API listening on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'modulus'}`);
  });
}

module.exports = app;
