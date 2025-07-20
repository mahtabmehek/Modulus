const express = require('express');
const jwt = require('jsonwebtoken');
const KaliDesktopService = require('../services/KaliDesktopService');

// Initialize Kali Desktop Service
const kaliService = new KaliDesktopService();

// Cleanup idle sessions every 30 minutes
setInterval(() => {
  kaliService.cleanupIdleSessions();
}, 30 * 60 * 1000);

const router = express.Router();

// Debug middleware to log all requests to desktop routes
router.use((req, res, next) => {
  console.log(`🖥️  DESKTOP ROUTE: ${req.method} ${req.path}`);
  next();
});

// Inline authentication middleware for Lambda compatibility
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 DESKTOP AUTH DEBUG: Header present:', !!authHeader);
  console.log('🔐 DESKTOP AUTH DEBUG: Token extracted:', !!token);

  if (!token) {
    console.log('❌ DESKTOP AUTH DEBUG: No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  const secret = process.env.JWT_SECRET || 'modulus-lms-secret-key-change-in-production';
  console.log('🔐 DESKTOP AUTH DEBUG: Using JWT secret:', secret.substring(0, 10) + '...');

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      console.log('❌ DESKTOP AUTH DEBUG: JWT verification failed:', err.message);
      console.log('❌ DESKTOP AUTH DEBUG: Token preview:', token.substring(0, 20) + '...');
      console.log('❌ DESKTOP AUTH DEBUG: Error name:', err.name);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    console.log('✅ DESKTOP AUTH DEBUG: JWT verification successful for user:', user.userId || user.id);
    req.user = user;
    next();
  });
};

// Create desktop session
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log(`🐉 Creating Kali desktop session for user ${userId}`);

    // Create Kali session
    const session = await kaliService.createKaliSession(userId);

    // Log session creation in database (if db is available)
    if (req.app.locals.db) {
      try {
        await req.app.locals.db.query(
          'INSERT INTO desktop_sessions (user_id, container_id, vnc_port, web_port, status, session_data, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [userId, session.containerId, session.port, session.port, 'running', JSON.stringify(session)]
        );
      } catch (dbError) {
        console.log('Database logging failed (continuing anyway):', dbError.message);
      }
    }

    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        vncUrl: session.vncUrl,
        webUrl: session.webUrl,
        port: session.port,
        status: session.status,
        osType: session.osType,
        ipAddress: session.ipAddress,
        persistenceType: 'container'
      }
    });
  } catch (error) {
    console.error('❌ Desktop session creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create desktop session'
    });
  }
});

// Get current session
router.get('/session', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check for active Kali session
    const session = await kaliService.getSession(userId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'No active session found'
      });
    }

    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        vncUrl: session.vncUrl,
        webUrl: session.webUrl,
        port: session.port,
        status: session.status,
        osType: session.osType,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Failed to get desktop session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get session'
    });
  }
});

// Terminate session
router.delete('/terminate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log(`🛑 Terminating Kali session for user ${userId}`);

    const result = await kaliService.terminateSession(userId);

    // Update database status if available
    if (req.app.locals.db) {
      try {
        await req.app.locals.db.query(
          'UPDATE desktop_sessions SET status = $1, ended_at = NOW() WHERE user_id = $2 AND status = $3',
          ['terminated', userId, 'running']
        );
      } catch (dbError) {
        console.log('Database update failed (continuing anyway):', dbError.message);
      }
    }

    res.json({
      success: true,
      message: 'Desktop session terminated'
    });
  } catch (error) {
    console.error('❌ Failed to terminate session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to terminate session'
    });
  }
});

// Get desktop system status (admin only)
router.get('/status', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const allSessions = kaliService.getAllSessions();

    res.json({
      success: true,
      status: {
        totalSessions: allSessions.length,
        activeSessions: allSessions.filter(s => s.status === 'running').length,
        sessions: allSessions.map(s => ({
          userId: s.userId,
          sessionId: s.sessionId,
          status: s.status,
          createdAt: s.createdAt,
          osType: s.osType
        }))
      }
    });
  } catch (error) {
    console.error('❌ Failed to get desktop status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get status'
    });
  }
});

module.exports = router;
