const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const RDSDataClient = require('./rds-data-client');
require('dotenv').config();

// Import routes (excluding desktop for Lambda)
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const healthRoutes = require('./routes/health');
const adminRoutes = require('./routes/admin');
const coursesRoutes = require('./routes/courses');
const labsRoutes = require('./routes/labs');

const app = express();

// Trust proxy for API Gateway
app.set('trust proxy', true);

// Rate limiting for Lambda
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    skip: (req) => !req.ip,
    keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'lambda-function';
    }
});

// Middleware
app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://d3u12l0h73n37a.cloudfront.net',
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
    next();
});

// Database connection using RDS Data API for Lambda
const rdsClient = new RDSDataClient();
app.locals.db = rdsClient;

// Routes (excluding desktop)
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/labs', labsRoutes);

// Health check endpoints
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        message: 'Modulus LMS Backend API is running',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production',
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

module.exports = app;
