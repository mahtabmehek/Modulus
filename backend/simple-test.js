const { pool } = require('./db');

async function simpleSubmissionTest() {
    try {
        console.log('🧪 Testing simple submission...');

        // Get test data
        const labResult = await pool.query('SELECT id FROM labs LIMIT 1');
        const userResult = await pool.query('SELECT id FROM users WHERE role = \'student\' LIMIT 1');
        const questionResult = await pool.query(`
            SELECT q.id, t.id as task_id, t.lab_id
            FROM questions q 
            JOIN tasks t ON q.task_id = t.id
            WHERE t.lab_id = $1
            LIMIT 1
        `, [labResult.rows[0].id]);

        if (labResult.rows.length === 0 || userResult.rows.length === 0 || questionResult.rows.length === 0) {
            console.log('❌ Missing test data');
            return;
        }

        const labId = labResult.rows[0].id;
        const userId = userResult.rows[0].id;
        const question = questionResult.rows[0];

        console.log('Test data:', { labId, userId, questionId: question.id, taskId: question.task_id });

        // Simple insert
        const result = await pool.query(`
            INSERT INTO user_submissions (user_id, lab_id, task_id, question_id, submitted_answer, is_correct, points_earned)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [userId, labId, question.task_id, question.id, 'test answer', true, 10]);

        console.log('✅ Submission created:', result.rows[0]);

        // Check lab completion
        const completion = await pool.query(`
            SELECT * FROM lab_completions 
            WHERE user_id = $1 AND lab_id = $2
        `, [userId, labId]);

        console.log('📊 Lab completion:', completion.rows);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

simpleSubmissionTest();
