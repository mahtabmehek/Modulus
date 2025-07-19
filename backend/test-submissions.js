const { pool } = require('./db');

async function testSubmissionsAPI() {
    try {
        console.log('🧪 Testing submissions table and API...');
        
        // Check if tables exist
        const tablesCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('user_submissions', 'lab_completions')
            ORDER BY table_name
        `);
        
        console.log('📊 Available tables:');
        tablesCheck.rows.forEach(row => {
            console.log(`  ✓ ${row.table_name}`);
        });
        
        // Check if we have sample data to work with
        const labsCheck = await pool.query('SELECT id, title FROM labs LIMIT 3');
        console.log('\n📝 Available labs for testing:');
        labsCheck.rows.forEach(lab => {
            console.log(`  - Lab ${lab.id}: ${lab.title}`);
        });
        
        const usersCheck = await pool.query('SELECT id, name, email FROM users WHERE role = \'student\' LIMIT 3');
        console.log('\n👥 Available students for testing:');
        usersCheck.rows.forEach(user => {
            console.log(`  - User ${user.id}: ${user.name} (${user.email})`);
        });
        
        // Check tasks and questions structure
        if (labsCheck.rows.length > 0) {
            const labId = labsCheck.rows[0].id;
            const tasksCheck = await pool.query(`
                SELECT t.id, t.title, COUNT(q.id) as question_count
                FROM tasks t
                LEFT JOIN questions q ON t.id = q.task_id
                WHERE t.lab_id = $1
                GROUP BY t.id, t.title
                ORDER BY t.order_index
            `, [labId]);
            
            console.log(`\n📋 Tasks and questions for Lab ${labId}:`);
            tasksCheck.rows.forEach(task => {
                console.log(`  - Task ${task.id}: ${task.title} (${task.question_count} questions)`);
            });
        }
        
        // Test submission workflow if we have data
        if (labsCheck.rows.length > 0 && usersCheck.rows.length > 0) {
            const labId = labsCheck.rows[0].id;
            const userId = usersCheck.rows[0].id;
            
            // Find first question
            const questionCheck = await pool.query(`
                SELECT q.id, q.title, q.expected_answer, t.id as task_id
                FROM questions q
                JOIN tasks t ON q.task_id = t.id
                WHERE t.lab_id = $1
                ORDER BY t.order_index, q.order_index
                LIMIT 1
            `, [labId]);
            
            if (questionCheck.rows.length > 0) {
                const question = questionCheck.rows[0];
                console.log(`\n🎯 Testing submission for question: ${question.title}`);
                
                // Test correct answer submission
                try {
                    const result = await pool.query(`
                        INSERT INTO user_submissions (user_id, lab_id, task_id, question_id, submitted_answer, is_correct, points_earned)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        ON CONFLICT (user_id, question_id) 
                        DO UPDATE SET
                          submitted_answer = EXCLUDED.submitted_answer,
                          is_correct = EXCLUDED.is_correct,
                          points_earned = EXCLUDED.points_earned,
                          updated_at = CURRENT_TIMESTAMP
                        RETURNING *
                    `, [userId, labId, question.task_id, question.id, question.expected_answer, true, 10]);
                    
                    console.log('✅ Test submission created:', {
                        submissionId: result.rows[0].id,
                        isCorrect: result.rows[0].is_correct,
                        pointsEarned: result.rows[0].points_earned
                    });
                    
                    // Check lab completion status
                    const completionCheck = await pool.query(`
                        SELECT * FROM lab_completions 
                        WHERE user_id = $1 AND lab_id = $2
                    `, [userId, labId]);
                    
                    if (completionCheck.rows.length > 0) {
                        const completion = completionCheck.rows[0];
                        console.log('📊 Lab completion status:', {
                            totalQuestions: completion.total_questions,
                            correctSubmissions: completion.correct_submissions,
                            completionPercentage: completion.completion_percentage + '%'
                        });
                    }
                    
                } catch (submissionError) {
                    console.log('❌ Submission test failed:', submissionError.message);
                }
            }
        }
        
        console.log('\n✅ Submissions API test completed!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testSubmissionsAPI();
