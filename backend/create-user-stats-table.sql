-- Create user_achievement_stats table
CREATE TABLE IF NOT EXISTS user_achievement_stats (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    labs_completed INTEGER DEFAULT 0,
    labs_attempted INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    last_activity_date TIMESTAMP,
    first_activity_date TIMESTAMP,
    total_points_earned INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    level_progress DECIMAL(5,2) DEFAULT 0.0,
    courses_completed INTEGER DEFAULT 0,
    modules_completed INTEGER DEFAULT 0,
    perfect_labs INTEGER DEFAULT 0,
    speed_completions INTEGER DEFAULT 0,
    help_given INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default stats for existing users
INSERT INTO user_achievement_stats (user_id) 
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM user_achievement_stats);
