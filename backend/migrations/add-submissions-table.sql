-- Add user_submissions table to track flag submissions and completion status
-- Created: July 19, 2025

-- Create submissions table to track user answers and completion status
CREATE TABLE IF NOT EXISTS user_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    
    -- Submission data
    submitted_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    points_earned INTEGER DEFAULT 0,
    
    -- Timestamps
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent multiple correct submissions for same question
    UNIQUE(user_id, question_id)
);

-- Create lab_completion table to track overall lab completion
CREATE TABLE IF NOT EXISTS lab_completions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    
    -- Completion data
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- Progress tracking
    total_questions INTEGER DEFAULT 0,
    correct_submissions INTEGER DEFAULT 0,
    total_points_possible INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Prevent duplicate entries
    UNIQUE(user_id, lab_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_submissions_user_lab ON user_submissions(user_id, lab_id);
CREATE INDEX IF NOT EXISTS idx_user_submissions_question ON user_submissions(question_id);
CREATE INDEX IF NOT EXISTS idx_user_submissions_correct ON user_submissions(is_correct);
CREATE INDEX IF NOT EXISTS idx_lab_completions_user ON lab_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_completions_lab ON lab_completions(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_completions_completed ON lab_completions(is_completed);

-- Function to automatically update lab completion status
CREATE OR REPLACE FUNCTION update_lab_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert lab completion record
    INSERT INTO lab_completions (user_id, lab_id, total_questions, correct_submissions, points_earned, completion_percentage)
    SELECT 
        NEW.user_id,
        NEW.lab_id,
        COUNT(q.id) as total_questions,
        COUNT(CASE WHEN us.is_correct = true THEN 1 END) as correct_submissions,
        COALESCE(SUM(CASE WHEN us.is_correct = true THEN us.points_earned ELSE 0 END), 0) as points_earned,
        CASE 
            WHEN COUNT(q.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN us.is_correct = true THEN 1 END) * 100.0) / COUNT(q.id), 2)
            ELSE 0 
        END as completion_percentage
    FROM tasks t
    JOIN questions q ON t.id = q.task_id
    LEFT JOIN user_submissions us ON us.question_id = q.id AND us.user_id = NEW.user_id
    WHERE t.lab_id = NEW.lab_id
    GROUP BY NEW.user_id, NEW.lab_id
    ON CONFLICT (user_id, lab_id) 
    DO UPDATE SET
        total_questions = EXCLUDED.total_questions,
        correct_submissions = EXCLUDED.correct_submissions,
        points_earned = EXCLUDED.points_earned,
        completion_percentage = EXCLUDED.completion_percentage,
        is_completed = (EXCLUDED.completion_percentage = 100.00),
        completed_at = CASE 
            WHEN EXCLUDED.completion_percentage = 100.00 AND lab_completions.completed_at IS NULL 
            THEN CURRENT_TIMESTAMP 
            ELSE lab_completions.completed_at 
        END,
        updated_at = CURRENT_TIMESTAMP;
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update lab completion when submissions change
DROP TRIGGER IF EXISTS trigger_update_lab_completion ON user_submissions;
CREATE TRIGGER trigger_update_lab_completion
    AFTER INSERT OR UPDATE ON user_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_lab_completion();

-- Add updated_at trigger for user_submissions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_updated_at_user_submissions ON user_submissions;
CREATE TRIGGER trigger_updated_at_user_submissions
    BEFORE UPDATE ON user_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
