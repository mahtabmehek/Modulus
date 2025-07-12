const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
require('dotenv').config();

// Import routes - updated for deployment test
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const healthRoutes = require('./routes/health');
const adminRoutes = require('./routes/admin');
const coursesRoutes = require('./routes/courses');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for API Gateway
app.set('trust proxy', true);

// Rate limiting - configured for Lambda environment
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  // Skip rate limiting if IP is undefined (Lambda environment)
  skip: (req) => !req.ip,
  // Use a custom key generator for Lambda
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'lambda-function';
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://localhost:3000',
    'https://localhost:3001',
    'http://modulus-frontend-1370267358.s3-website.eu-west-2.amazonaws.com',
    process.env.FRONTEND_URL,
    '*'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Original URL:', req.originalUrl);
  console.log('Base URL:', req.baseUrl);
  next();
});

// Database connection
let pool;

// Use real PostgreSQL database (Aurora)
pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5, // Reduced for Aurora Serverless
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000, // Increased for Aurora cold starts
    acquireTimeoutMillis: 20000, // Additional timeout for acquiring connections
    createTimeoutMillis: 20000, // Timeout for creating connections
  });

// Make pool available to routes
app.locals.db = pool;

// Test database connection on startup
pool.connect()
  .then(client => {
    console.log('✅ Connected to database');
    if (client.release) client.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  });

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', coursesRoutes);

// Simple health check endpoint for ECS health checks
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

// Export the app for Lambda deployment
module.exports = app;

// Only start the server if running directly (not in Lambda)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Modulus Backend API listening on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  });
}
