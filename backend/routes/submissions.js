const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'modulus-lms-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// POST /api/submissions - Submit an answer for a question
router.post('/', 
  authenticateToken,
  [
    body('labId').isInt().withMessage('Lab ID must be an integer'),
    body('taskId').isInt().withMessage('Task ID must be an integer'), 
    body('questionId').isInt().withMessage('Question ID must be an integer'),
    body('submittedAnswer').trim().notEmpty().withMessage('Answer cannot be empty')
  ],
  async (req, res) => {
    try {
      const db = pool;
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { labId, taskId, questionId, submittedAnswer } = req.body;
      const userId = req.user.userId;

      // Get question details to check the expected answer
      const questionQuery = `
        SELECT q.*, t.lab_id, t.title as task_title
        FROM questions q
        JOIN tasks t ON q.task_id = t.id
        WHERE q.id = $1 AND t.id = $2 AND t.lab_id = $3
      `;
      
      const questionResult = await db.query(questionQuery, [questionId, taskId, labId]);
      
      if (questionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const question = questionResult.rows[0];
      const expectedAnswer = question.expected_answer;
      
      // Check if answer is correct (case-insensitive comparison)
      const isCorrect = submittedAnswer.trim().toLowerCase() === expectedAnswer.toLowerCase();
      const pointsEarned = isCorrect ? (question.points || 0) : 0;

      // Insert or update submission
      const submissionQuery = `
        INSERT INTO user_submissions (user_id, lab_id, task_id, question_id, submitted_answer, is_correct, points_earned)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, question_id) 
        DO UPDATE SET
          submitted_answer = EXCLUDED.submitted_answer,
          is_correct = EXCLUDED.is_correct,
          points_earned = EXCLUDED.points_earned,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const submissionResult = await db.query(submissionQuery, [
        userId, labId, taskId, questionId, submittedAnswer, isCorrect, pointsEarned
      ]);

      const submission = submissionResult.rows[0];

      // Return response with feedback
      res.json({
        success: true,
        data: {
          submissionId: submission.id,
          isCorrect,
          pointsEarned,
          submittedAt: submission.submitted_at,
          feedback: isCorrect ? 
            'Correct! Well done.' : 
            'Incorrect answer. Please try again.'
        }
      });

    } catch (error) {
      console.error('Error submitting answer:', error);
      res.status(500).json({
        error: 'Failed to submit answer',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// GET /api/submissions/lab/:labId - Get user's submissions for a specific lab
router.get('/lab/:labId', authenticateToken, async (req, res) => {
  try {
    const db = pool;
    const { labId } = req.params;
    const userId = req.user.userId;

    // Get all submissions for this user and lab
    const submissionsQuery = `
      SELECT 
        us.*,
        q.title as question_title,
        q.type as question_type,
        t.title as task_title,
        t.id as task_id
      FROM user_submissions us
      JOIN questions q ON us.question_id = q.id
      JOIN tasks t ON us.task_id = t.id
      WHERE us.user_id = $1 AND us.lab_id = $2
      ORDER BY t.order_index, q.order_index
    `;

    const submissionsResult = await db.query(submissionsQuery, [userId, labId]);

    // Get lab completion status
    const completionQuery = `
      SELECT * FROM lab_completions 
      WHERE user_id = $1 AND lab_id = $2
    `;

    const completionResult = await db.query(completionQuery, [userId, labId]);
    const completion = completionResult.rows[0] || null;

    res.json({
      success: true,
      data: {
        submissions: submissionsResult.rows,
        completion: completion
      }
    });

  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      error: 'Failed to fetch submissions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/submissions/question/:questionId - Check if user has submitted for a specific question
router.get('/question/:questionId', authenticateToken, async (req, res) => {
  try {
    const db = pool;
    const { questionId } = req.params;
    const userId = req.user.userId;

    const submissionQuery = `
      SELECT * FROM user_submissions 
      WHERE user_id = $1 AND question_id = $2
    `;

    const result = await db.query(submissionQuery, [userId, questionId]);
    const submission = result.rows[0] || null;

    res.json({
      success: true,
      data: {
        hasSubmission: !!submission,
        submission: submission
      }
    });

  } catch (error) {
    console.error('Error checking question submission:', error);
    res.status(500).json({
      error: 'Failed to check submission',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/submissions/user/:userId/lab/:labId - Get submissions for any user (instructor/admin only)
router.get('/user/:userId/lab/:labId', authenticateToken, async (req, res) => {
  try {
    // Only instructors and admins can view other users' submissions
    if (!['instructor', 'admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const db = pool;
    const { userId, labId } = req.params;

    const submissionsQuery = `
      SELECT 
        us.*,
        q.title as question_title,
        q.type as question_type,
        q.expected_answer,
        t.title as task_title,
        u.name as user_name,
        u.email as user_email
      FROM user_submissions us
      JOIN questions q ON us.question_id = q.id
      JOIN tasks t ON us.task_id = t.id
      JOIN users u ON us.user_id = u.id
      WHERE us.user_id = $1 AND us.lab_id = $2
      ORDER BY t.order_index, q.order_index
    `;

    const submissionsResult = await db.query(submissionsQuery, [userId, labId]);

    // Get lab completion status
    const completionQuery = `
      SELECT lc.*, u.name as user_name, u.email as user_email
      FROM lab_completions lc
      JOIN users u ON lc.user_id = u.id
      WHERE lc.user_id = $1 AND lc.lab_id = $2
    `;

    const completionResult = await db.query(completionQuery, [userId, labId]);
    const completion = completionResult.rows[0] || null;

    res.json({
      success: true,
      data: {
        submissions: submissionsResult.rows,
        completion: completion
      }
    });

  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({
      error: 'Failed to fetch user submissions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/submissions/lab/:labId/all - Get all submissions for a lab (instructor/admin only)
router.get('/lab/:labId/all', authenticateToken, async (req, res) => {
  try {
    // Only instructors and admins can view all submissions
    if (!['instructor', 'admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const db = pool;
    const { labId } = req.params;

    // Get all completions for this lab
    const completionsQuery = `
      SELECT 
        lc.*,
        u.name as user_name,
        u.email as user_email,
        l.title as lab_title
      FROM lab_completions lc
      JOIN users u ON lc.user_id = u.id
      JOIN labs l ON lc.lab_id = l.id
      WHERE lc.lab_id = $1
      ORDER BY lc.completion_percentage DESC, lc.started_at ASC
    `;

    const completionsResult = await db.query(completionsQuery, [labId]);

    // Get submission statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT us.user_id) as total_users,
        COUNT(CASE WHEN us.is_correct = true THEN 1 END) as correct_submissions,
        COUNT(*) as total_submissions,
        ROUND(AVG(CASE WHEN us.is_correct = true THEN 100.0 ELSE 0.0 END), 2) as avg_success_rate
      FROM user_submissions us
      WHERE us.lab_id = $1
    `;

    const statsResult = await db.query(statsQuery, [labId]);
    const stats = statsResult.rows[0];

    res.json({
      success: true,
      data: {
        completions: completionsResult.rows,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Error fetching lab submissions:', error);
    res.status(500).json({
      error: 'Failed to fetch lab submissions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
