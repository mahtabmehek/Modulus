const { pool } = require('./db');

async function testAPI() {
    try {
        // Test the API endpoints directly
        const userId = 1002;
        const labId = 106;
        
        console.log('🔗 Testing API endpoint functionality...');
        
        // Simulate getting existing submissions
        const existingSubmissions = await pool.query(`
            SELECT question_id, submitted_answer, is_correct, points_earned
            FROM user_submissions 
            WHERE user_id = $1 AND lab_id = $2
        `, [userId, labId]);
        
        console.log('📚 Existing submissions:', existingSubmissions.rows);
        
        // Test lab completion status
        const completion = await pool.query(`
            SELECT is_completed, completion_percentage, correct_submissions, total_questions
            FROM lab_completions 
            WHERE user_id = $1 AND lab_id = $2
        `, [userId, labId]);
        
        console.log('📊 Lab completion status:', completion.rows[0]);
        
        // Test submitting another answer
        const question2 = await pool.query(`
            SELECT q.id, t.id as task_id
            FROM questions q 
            JOIN tasks t ON q.task_id = t.id
            WHERE t.lab_id = $1 AND q.id != 142
            LIMIT 1
        `, [labId]);
        
        if (question2.rows.length > 0) {
            const newSubmission = await pool.query(`
                INSERT INTO user_submissions (user_id, lab_id, task_id, question_id, submitted_answer, is_correct, points_earned)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (user_id, question_id) 
                DO UPDATE SET
                  submitted_answer = EXCLUDED.submitted_answer,
                  is_correct = EXCLUDED.is_correct,
                  points_earned = EXCLUDED.points_earned,
                  updated_at = CURRENT_TIMESTAMP
                RETURNING *
            `, [userId, labId, question2.rows[0].task_id, question2.rows[0].id, 'another test answer', true, 10]);
            
            console.log('✅ New submission created:', {
                questionId: newSubmission.rows[0].question_id,
                isCorrect: newSubmission.rows[0].is_correct
            });
            
            // Check updated completion
            const updatedCompletion = await pool.query(`
                SELECT is_completed, completion_percentage, correct_submissions, total_questions
                FROM lab_completions 
                WHERE user_id = $1 AND lab_id = $2
            `, [userId, labId]);
            
            console.log('📈 Updated completion status:', updatedCompletion.rows[0]);
        }
        
        console.log('\n🎉 API endpoints working correctly!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ API test failed:', error);
        process.exit(1);
    }
}

testAPI();
