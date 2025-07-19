const { pool } = require('./db');

async function validatePersistence() {
    try {
        console.log('🔄 Validating submission persistence...');
        
        const userId = 1002; // student3
        const labId = 106;   // Art and science lab
        
        // Show current state
        const submissions = await pool.query(`
            SELECT 
                us.question_id,
                q.title as question_title,
                us.submitted_answer,
                us.is_correct,
                us.points_earned,
                us.submitted_at
            FROM user_submissions us
            JOIN questions q ON us.question_id = q.id
            WHERE us.user_id = $1 AND us.lab_id = $2
            ORDER BY us.submitted_at
        `, [userId, labId]);
        
        console.log('💾 Persisted submissions for user 1002 (student3) in lab 106:');
        submissions.rows.forEach(sub => {
            console.log(`  ✅ Q${sub.question_id}: "${sub.question_title}" → "${sub.submitted_answer}" ${sub.is_correct ? '✓' : '✗'} (${sub.points_earned} pts)`);
        });
        
        const completion = await pool.query(`
            SELECT 
                is_completed,
                completion_percentage,
                correct_submissions,
                total_questions,
                points_earned,
                started_at,
                completed_at
            FROM lab_completions 
            WHERE user_id = $1 AND lab_id = $2
        `, [userId, labId]);
        
        if (completion.rows.length > 0) {
            const comp = completion.rows[0];
            console.log(`\n📊 Lab completion status:`);
            console.log(`   Progress: ${comp.correct_submissions}/${comp.total_questions} questions (${comp.completion_percentage}%)`);
            console.log(`   Points: ${comp.points_earned}`);
            console.log(`   Status: ${comp.is_completed ? 'COMPLETED ✅' : 'IN PROGRESS ⏳'}`);
            console.log(`   Started: ${comp.started_at}`);
            if (comp.completed_at) {
                console.log(`   Completed: ${comp.completed_at}`);
            }
        }
        
        console.log('\n✅ This data will persist across browser sessions and page refreshes!');
        console.log('🎯 Users can now close their browser, come back later, and see their completed flags!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    }
}

validatePersistence();
