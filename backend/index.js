const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { pool, testConnection } = require('./db');
const rateLimit = require('express-rate-limit');

const app = express();

// Rate limiting for development
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(limiter);
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
}));
app.use(express.json());

// Add general request logging
app.use((req, res, next) => {
    console.log('🌐 ALL REQUESTS:', {
        method: req.method,
        url: req.url,
        originalUrl: req.originalUrl,
        path: req.path,
        headers: {
            'content-type': req.headers['content-type'],
            'authorization': req.headers['authorization'] ? 'Bearer ***' : 'None'
        }
    })
    next()
})

// Handle preflight OPTIONS requests globally
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.status(200).end();
});

// Import and use file routes
const filesRouter = require('./routes/files');
app.use('/api/files', filesRouter);

// Import and use auth routes
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// Import and use admin routes
const adminRouter = require('./routes/admin');
app.use('/api/admin', adminRouter);

// Import and use other routes
const coursesRouter = require('./routes/courses');
app.use('/api/courses', coursesRouter);

const labsRouter = require('./routes/labs');
app.use('/api/labs', labsRouter);

const moduleLabsRouter = require('./routes/module-labs');
app.use('/api', moduleLabsRouter);

const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

const healthRouter = require('./routes/health');
app.use('/api/health', healthRouter);

const systemRouter = require('./routes/system');
app.use('/api/system', systemRouter);

// Static file serving with enhanced CORS headers
app.use('/uploads', (req, res, next) => {
    // Set CORS headers for static files
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.header('Cache-Control', 'public, max-age=31536000');

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    next();
}, express.static(path.join(__dirname, 'uploads')));

// Test database connection on startup
testConnection().catch(console.error);

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await testConnection();
        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get all courses
app.get('/api/courses', async (req, res) => {
    try {
        console.log('Fetching courses...');
        const result = await pool.query(`
            SELECT 
                id,
                title,
                description,
                instructor_id,
                duration,
                level,
                price,
                rating,
                students_enrolled,
                category,
                image_url,
                created_at,
                updated_at
            FROM courses 
            ORDER BY created_at DESC
        `);

        console.log(`Found ${result.rows.length} courses`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({
            error: 'Failed to fetch courses',
            details: error.message
        });
    }
});

// Get course by ID
app.get('/api/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Fetching course with ID: ${id}`);

        const result = await pool.query(`
            SELECT 
                id,
                title,
                description,
                instructor_id,
                duration,
                level,
                price,
                rating,
                students_enrolled,
                category,
                image_url,
                created_at,
                updated_at
            FROM courses 
            WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({
            error: 'Failed to fetch course',
            details: error.message
        });
    }
});

// User registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log(`Registration attempt for: ${email}`);

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            [username, email, hashedPassword]
        );

        const user = result.rows[0];
        console.log(`User created successfully: ${user.id}`);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'modulus-lms-secret-key-change-in-production',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Failed to create user',
            details: error.message
        });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Login attempt for: ${email}`);

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const result = await pool.query(
            'SELECT id, username, email, password_hash FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log(`User logged in successfully: ${user.id}`);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'modulus-lms-secret-key-change-in-production',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            details: error.message
        });
    }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'modulus-lms-secret-key-change-in-production', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Protected route example - Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, created_at FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch profile',
            details: error.message
        });
    }
});

// Admin/Instructor middleware
const requireStaffOrAdmin = (req, res, next) => {
    if (!['admin', 'staff', 'instructor'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Staff or admin access required' });
    }
    next();
};

// Lab Content Routes (VM integration will be added later)

// GET /api/labs - Get all labs (with optional module filter)
app.get('/api/labs', authenticateToken, async (req, res) => {
    try {
        const { module_id } = req.query;

        let query, params = [];

        if (module_id) {
            // Get labs for a specific module using junction table
            query = `
                SELECT 
                    l.id, l.title, l.description, l.instructions,
                    l.is_published, l.estimated_minutes,
                    l.points_possible, l.max_attempts, l.created_at, l.updated_at,
                    l.lab_type, l.vm_image, l.icon_path, l.tags,
                    ml.order_index as module_order,
                    m.title as module_title, m.course_id,
                    ml.added_at as added_to_module
                FROM labs l
                JOIN module_labs ml ON l.id = ml.lab_id
                JOIN modules m ON ml.module_id = m.id
                WHERE l.is_published = true AND ml.module_id = $1
                ORDER BY ml.order_index
            `;
            params = [module_id];
        } else {
            // Get all labs with their module associations
            query = `
                SELECT 
                    l.id, l.title, l.description, l.instructions,
                    l.is_published, l.estimated_minutes,
                    l.points_possible, l.max_attempts, l.created_at, l.updated_at,
                    l.lab_type, l.vm_image, l.icon_path, l.tags,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'module_id', ml.module_id,
                                'module_title', m.title,
                                'course_id', m.course_id,
                                'order_index', ml.order_index
                            )
                        ) FILTER (WHERE ml.module_id IS NOT NULL), 
                        '[]'::json
                    ) as modules
                FROM labs l
                LEFT JOIN module_labs ml ON l.id = ml.lab_id
                LEFT JOIN modules m ON ml.module_id = m.id
                WHERE l.is_published = true
                GROUP BY l.id, l.title, l.description, l.instructions,
                         l.is_published, l.estimated_minutes, l.points_possible,
                         l.max_attempts, l.created_at, l.updated_at,
                         l.lab_type, l.vm_image, l.icon_path, l.tags
                ORDER BY l.created_at DESC
            `;
        }

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching labs:', error);
        res.status(500).json({
            error: 'Failed to fetch labs',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/labs/:id - Get specific lab content
app.get('/api/labs/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                l.id, l.module_id, l.title, l.description, l.instructions,
                l.order_index, l.is_published, l.estimated_minutes,
                l.points_possible, l.max_attempts, l.created_at, l.updated_at,
                m.title as module_title, m.course_id, c.title as course_title
            FROM labs l
            JOIN modules m ON l.module_id = m.id
            JOIN courses c ON m.course_id = c.id
            WHERE l.id = $1 AND l.is_published = true
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lab not found or not published' });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching lab:', error);
        res.status(500).json({
            error: 'Failed to fetch lab details',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// POST /api/labs - Create new lab content (Admin/Instructor only)
app.post('/api/labs',
    authenticateToken,
    requireStaffOrAdmin,
    [
        body('module_id').optional().isInt().withMessage('Module ID must be a valid integer'),
        body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title must be 1-255 characters'),
        body('description').optional().isLength({ max: 2000 }).withMessage('Description must be under 2000 characters'),
        body('instructions').optional().isLength({ max: 10000 }).withMessage('Instructions must be under 10000 characters'),
        body('order_index').optional().isInt({ min: 0 }).withMessage('Order index must be non-negative'),
        body('estimated_minutes').optional().isInt({ min: 1 }).withMessage('Estimated minutes must be positive'),
        body('points_possible').optional().isInt({ min: 0 }).withMessage('Points must be non-negative integer'),
        body('max_attempts').optional().isInt({ min: 0 }).withMessage('Max attempts must be non-negative'),
        body('is_published').optional().isBoolean().withMessage('Published status must be boolean')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const {
                module_id,
                title,
                description,
                instructions,
                order_index,
                estimated_minutes,
                points_possible,
                max_attempts,
                is_published
            } = req.body;

            // Verify module exists only if module_id is provided
            if (module_id) {
                const moduleCheck = await pool.query(
                    'SELECT id FROM modules WHERE id = $1',
                    [module_id]
                );

                if (moduleCheck.rows.length === 0) {
                    return res.status(404).json({ error: 'Module not found' });
                }
            }

            // Get next order index if not provided
            let finalOrderIndex = order_index;
            if (finalOrderIndex === undefined) {
                if (module_id) {
                    // If module_id is provided, get next order within that module
                    const orderResult = await pool.query(
                        'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM labs WHERE module_id = $1',
                        [module_id]
                    );
                    finalOrderIndex = orderResult.rows[0].next_order;
                } else {
                    // If no module_id, get next order among standalone labs
                    const orderResult = await pool.query(
                        'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM labs WHERE module_id IS NULL'
                    );
                    finalOrderIndex = orderResult.rows[0].next_order;
                }
            }

            const query = `
                INSERT INTO labs (
                    module_id, title, description, instructions, order_index,
                    estimated_minutes, points_possible, max_attempts, is_published
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const values = [
                module_id,
                title,
                description || null,
                instructions || null,
                finalOrderIndex,
                estimated_minutes || 30,
                points_possible || 100,
                max_attempts || 0,
                is_published || false
            ];

            const result = await pool.query(query, values);

            res.status(201).json({
                success: true,
                message: 'Lab content created successfully',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error creating lab:', error);
            res.status(500).json({
                error: 'Failed to create lab',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        details: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Lambda handler for AWS
exports.handler = async (event, context) => {
    console.log('Lambda event:', JSON.stringify(event, null, 2));

    try {
        // Test database connection
        await testConnection();
        console.log('Database connection verified');
    } catch (error) {
        console.error('Database connection failed:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                error: 'Database connection failed',
                details: error.message
            })
        };
    }

    return new Promise((resolve) => {
        const serverlessExpress = require('@vendia/serverless-express');
        const server = serverlessExpress({ app });
        server(event, context, (error, result) => {
            if (error) {
                console.error('Serverless Express error:', error);
                resolve({
                    statusCode: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                    },
                    body: JSON.stringify({
                        error: 'Internal server error',
                        details: error.message
                    })
                });
            } else {
                resolve(result);
            }
        });
    });
};

// For local development
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
