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

// Inline authentication middleware for Lambda compatibility
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
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

    const sessionData = result.rows[0];
    const session = JSON.parse(sessionData.session_data);

    // Verify container is still running
    const isRunning = await desktopManager.isSessionActive(userId);

    if (!isRunning) {
      // Update database to reflect terminated status
      await req.app.locals.db.query(
        'UPDATE desktop_sessions SET status = $1, terminated_at = NOW() WHERE id = $2',
        ['terminated', sessionData.id]
      );

      return res.status(404).json({
        success: false,
        error: 'Session no longer active'
      });
    }

    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        vncUrl: session.vncUrl,
        webUrl: session.webUrl,
        status: 'running',
        persistenceType: 'hybrid',
        labId: sessionData.lab_id,
        createdAt: sessionData.created_at
      }
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get session information'
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

    const userId = req.user.id;

    console.log(`Terminating desktop session for user ${userId}`);

    const result = await desktopManager.terminateUserSession(userId);

    // Update database
    await req.app.locals.db.query(
      'UPDATE desktop_sessions SET status = $1, terminated_at = NOW() WHERE user_id = $2 AND status = $3',
      ['terminated', userId, 'running']
    );

    res.json({
      success: true,
      result: {
        status: result.status,
        dataPersisted: result.dataPersisted,
        persistenceType: result.persistenceType
      }
    });
  } catch (error) {
    console.error('Desktop session termination error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to terminate desktop session'
    });
  }
});

// Get user's backup history
router.get('/backups', authenticateToken, async (req, res) => {
  try {
    if (!desktopManager) {
      return res.status(503).json({ message: 'Desktop service not available in this environment' });
    }
    const userId = req.user.id;

    const backups = await desktopManager.listUserBackups(userId);

    res.json({
      success: true,
      backups
    });
  } catch (error) {
    console.error('Get backups error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get backup history'
    });
  }
});

// Extend session (reset timeout)
router.post('/extend', authenticateToken, async (req, res) => {
  try {
    if (!desktopManager) {
      return res.status(503).json({ message: 'Desktop service not available in this environment' });
    }

    const userId = req.user.id;

    const result = await desktopManager.extendUserSession(userId);

    if (result.success) {
      // Update last accessed time in database
      await req.app.locals.db.query(
        'UPDATE desktop_sessions SET last_accessed = NOW() WHERE user_id = $1 AND status = $2',
        [userId, 'running']
      );
    }

    res.json({
      success: result.success,
      message: result.message || 'Session extended successfully'
    });
  } catch (error) {
    console.error('Extend session error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extend session'
    });
  }
});

// Get desktop status/health
router.get('/status', authenticateToken, async (req, res) => {
  try {
    if (!desktopManager) {
      return res.status(503).json({ message: 'Desktop service not available in this environment' });
    }
    const userId = req.user.id;

    const status = await desktopManager.getSystemStatus();
    const userSession = await desktopManager.getUserSessionStatus(userId);

    res.json({
      success: true,
      system: status,
      userSession
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get status'
    });
  }
});

module.exports = router;
