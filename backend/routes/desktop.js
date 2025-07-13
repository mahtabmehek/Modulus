const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const HybridDesktopManager = require('../services/HybridDesktopManager');
const router = express.Router();

const desktopManager = new HybridDesktopManager();

// Create desktop session
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { labId } = req.body;
    const userId = req.user.id;

    console.log(`Creating desktop session for user ${userId}, lab ${labId}`);

    const session = await desktopManager.createUserSession(userId, labId);

    // Log session creation in database
    await req.app.locals.db.query(
      'INSERT INTO desktop_sessions (user_id, lab_id, container_id, vnc_port, web_port, status, session_data) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, labId, session.sessionId, session.vncPort || 0, session.webPort || 0, 'running', JSON.stringify(session)]
    );

    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        vncUrl: session.vncUrl,
        webUrl: session.webUrl,
        status: session.status,
        persistenceType: 'hybrid',
        labId
      }
    });
  } catch (error) {
    console.error('Desktop session creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create desktop session'
    });
  }
});

// Get current session
router.get('/session', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check for active session in database
    const result = await req.app.locals.db.query(
      'SELECT * FROM desktop_sessions WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
      [userId, 'running']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active session found'
      });
    }

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
