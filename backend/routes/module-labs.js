const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'modulus-lms-secret-key-change-in-production';

// Test route to verify module-labs router is working
router.get('/test', (req, res) => {
    console.log('🧪 MODULE-LABS TEST ROUTE - Hit successfully');
    res.json({ message: 'Module-labs router is working!' });
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    console.log('🔐 MODULE-LABS AUTH - Starting authentication check');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔐 MODULE-LABS AUTH - Auth header:', authHeader ? 'Present' : 'Missing');
    console.log('🔐 MODULE-LABS AUTH - Token extracted:', token ? 'Present' : 'Missing');

    if (!token) {
        console.log('❌ MODULE-LABS AUTH - No token provided');
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('❌ MODULE-LABS AUTH - Token verification failed:', err.message);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        console.log('✅ MODULE-LABS AUTH - Token verified successfully for user:', user.email);
        req.user = user;
        next();
    });
};

// Add lab to module (Many-to-Many relationship)
router.post('/modules/:moduleId/labs/:labId', async (req, res) => {
    try {
        const { moduleId, labId } = req.params;
        const { order_index } = req.body;

        // Check if module exists
        const moduleCheck = await pool.query('SELECT id FROM modules WHERE id = $1', [moduleId]);
        if (moduleCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }

        // Check if lab exists
        const labCheck = await pool.query('SELECT id FROM labs WHERE id = $1', [labId]);
        if (labCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Lab not found' });
        }

        // Get next order index if not provided
        let finalOrderIndex = order_index;
        if (finalOrderIndex === undefined) {
            const orderResult = await pool.query(
                'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM module_labs WHERE module_id = $1',
                [moduleId]
            );
            finalOrderIndex = orderResult.rows[0].next_order;
        }

        // Add lab to module
        const result = await pool.query(`
            INSERT INTO module_labs (module_id, lab_id, order_index)
            VALUES ($1, $2, $3)
            ON CONFLICT (module_id, lab_id) 
            DO UPDATE SET order_index = EXCLUDED.order_index, added_at = CURRENT_TIMESTAMP
            RETURNING *;
        `, [moduleId, labId, finalOrderIndex]);

        res.json({
            success: true,
            message: 'Lab added to module successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding lab to module:', error);
        res.status(500).json({ error: 'Failed to add lab to module' });
    }
});

// Remove lab from module
router.delete('/modules/:moduleId/labs/:labId', async (req, res) => {
    try {
        const { moduleId, labId } = req.params;

        const result = await pool.query(`
            DELETE FROM module_labs 
            WHERE module_id = $1 AND lab_id = $2
            RETURNING *;
        `, [moduleId, labId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lab not found in this module' });
        }

        res.json({
            success: true,
            message: 'Lab removed from module successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error removing lab from module:', error);
        res.status(500).json({ error: 'Failed to remove lab from module' });
    }
});

// Get all labs in a module (with junction table)
router.get('/modules/:moduleId/labs', async (req, res) => {
    try {
        const { moduleId } = req.params;
        console.log('🔍 MODULE-LABS GET - Module ID:', moduleId);
        console.log('🔍 MODULE-LABS GET - Request headers:', req.headers);

        const result = await pool.query(`
            SELECT 
                l.*,
                ml.order_index as module_order,
                ml.added_at as added_to_module
            FROM labs l
            JOIN module_labs ml ON l.id = ml.lab_id
            WHERE ml.module_id = $1
            ORDER BY ml.order_index;
        `, [moduleId]);

        console.log('🔍 MODULE-LABS GET - Query result:', result.rows.length, 'labs found');
        console.log('🔍 MODULE-LABS GET - Labs data:', result.rows);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ MODULE-LABS GET - Error fetching module labs:', error);
        res.status(500).json({ error: 'Failed to fetch module labs' });
    }
});

// Get all modules containing a specific lab
router.get('/labs/:labId/modules', async (req, res) => {
    try {
        const { labId } = req.params;

        const result = await pool.query(`
            SELECT 
                m.*,
                ml.order_index as lab_order_in_module,
                ml.added_at as added_to_module
            FROM modules m
            JOIN module_labs ml ON m.id = ml.module_id
            WHERE ml.lab_id = $1
            ORDER BY m.title;
        `, [labId]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching lab modules:', error);
        res.status(500).json({ error: 'Failed to fetch lab modules' });
    }
});

// Update lab order within a module
router.put('/modules/:moduleId/labs/:labId/order', async (req, res) => {
    try {
        const { moduleId, labId } = req.params;
        const { order_index } = req.body;

        if (order_index === undefined) {
            return res.status(400).json({ error: 'order_index is required' });
        }

        const result = await pool.query(`
            UPDATE module_labs 
            SET order_index = $1 
            WHERE module_id = $2 AND lab_id = $3
            RETURNING *;
        `, [order_index, moduleId, labId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lab not found in this module' });
        }

        res.json({
            success: true,
            message: 'Lab order updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating lab order:', error);
        res.status(500).json({ error: 'Failed to update lab order' });
    }
});

// Get standalone labs (not in any module)
router.get('/labs/standalone', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT l.*
            FROM labs l
            LEFT JOIN module_labs ml ON l.id = ml.lab_id
            WHERE ml.lab_id IS NULL
            ORDER BY l.created_at DESC;
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching standalone labs:', error);
        res.status(500).json({ error: 'Failed to fetch standalone labs' });
    }
});

module.exports = router;
