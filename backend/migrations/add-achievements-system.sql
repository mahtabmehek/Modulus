-- Achievements System Database Schema
-- Created: July 20, 2025

-- 1. Achievements Definition Table
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    achievement_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'first_lab', 'week_warrior'
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL, -- emoji or icon identifier
    category VARCHAR(50) NOT NULL, -- 'progress', 'streak', 'skill', 'special'
    rarity VARCHAR(20) NOT NULL DEFAULT 'common', -- 'common', 'uncommon', 'rare', 'epic', 'legendary'
    points INTEGER NOT NULL DEFAULT 0,
    
    -- Unlock criteria (stored as JSONB for flexibility)
    criteria JSONB NOT NULL, -- e.g., {"type": "labs_completed", "value": 1}
    
    -- Display properties
    is_active BOOLEAN DEFAULT TRUE,
    is_hidden BOOLEAN DEFAULT FALSE, -- secret achievements
    unlock_order INTEGER DEFAULT 0, -- for ordered unlocks
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Achievements Tracking Table
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    
    -- Achievement details
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_value INTEGER DEFAULT 0, -- current progress towards achievement
    is_completed BOOLEAN DEFAULT TRUE,
    
    -- Prevent duplicate achievements per user
    UNIQUE(user_id, achievement_id)
);

-- 3. Achievement Categories Table
CREATE TABLE IF NOT EXISTS achievement_categories (
    id SERIAL PRIMARY KEY,
    category_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. User Statistics Table (for achievement calculations)
CREATE TABLE IF NOT EXISTS user_statistics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Lab statistics
    labs_completed INTEGER DEFAULT 0,
    labs_attempted INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    
    -- Time-based statistics
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    last_activity_date DATE,
    first_activity_date DATE,
    
    -- Points and levels
    total_points_earned INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    level_progress INTEGER DEFAULT 0, -- points towards next level
    
    -- Course/module progress
    courses_completed INTEGER DEFAULT 0,
    modules_completed INTEGER DEFAULT 0,
    
    -- Special achievements tracking
    perfect_labs INTEGER DEFAULT 0, -- labs completed with 100% accuracy
    speed_completions INTEGER DEFAULT 0, -- labs completed under time threshold
    help_given INTEGER DEFAULT 0, -- future: helping other students
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);
CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON user_statistics(user_id);

-- Insert default achievement categories
INSERT INTO achievement_categories (category_key, name, description, icon, sort_order) VALUES
('welcome', 'Welcome', 'Getting started achievements', '👋', 1),
('progress', 'Progress', 'Lab and course completion milestones', '📈', 2),
('streak', 'Consistency', 'Daily learning and streak achievements', '🔥', 3),
('skill', 'Skills', 'Subject-specific mastery achievements', '🎯', 4),
('speed', 'Speed', 'Time-based completion achievements', '⚡', 5),
('perfection', 'Perfection', 'Accuracy and excellence achievements', '💎', 6),
('special', 'Special', 'Rare and event-based achievements', '⭐', 7)
ON CONFLICT (category_key) DO NOTHING;

-- Insert default achievements
INSERT INTO achievements (achievement_key, name, description, icon, category, rarity, points, criteria) VALUES
-- Welcome achievements
('first_login', 'Welcome to Modulus', 'Complete your first login to the platform', '👋', 'welcome', 'common', 10, 
 '{"type": "login_count", "value": 1}'),
('profile_complete', 'Profile Master', 'Complete your user profile information', '📝', 'welcome', 'common', 25, 
 '{"type": "profile_completion", "value": 100}'),

-- Progress achievements
('first_lab', 'Lab Explorer', 'Complete your first lab exercise', '🔬', 'progress', 'common', 50, 
 '{"type": "labs_completed", "value": 1}'),
('lab_veteran', 'Lab Veteran', 'Complete 10 lab exercises', '🧪', 'progress', 'uncommon', 200, 
 '{"type": "labs_completed", "value": 10}'),
('lab_master', 'Lab Master', 'Complete 25 lab exercises', '⚗️', 'progress', 'rare', 500, 
 '{"type": "labs_completed", "value": 25}'),
('first_module', 'Module Pioneer', 'Complete your first module', '📚', 'progress', 'common', 100, 
 '{"type": "modules_completed", "value": 1}'),
('course_finisher', 'Course Finisher', 'Complete your first course', '🎓', 'progress', 'uncommon', 300, 
 '{"type": "courses_completed", "value": 1}'),

-- Streak achievements
('week_warrior', 'Week Warrior', 'Maintain a 7-day learning streak', '🔥', 'streak', 'uncommon', 150, 
 '{"type": "streak_days", "value": 7}'),
('month_champion', 'Month Champion', 'Maintain a 30-day learning streak', '🏆', 'streak', 'rare', 750, 
 '{"type": "streak_days", "value": 30}'),
('streak_legend', 'Streak Legend', 'Maintain a 100-day learning streak', '🌟', 'streak', 'legendary', 2000, 
 '{"type": "streak_days", "value": 100}'),

-- Speed achievements
('speed_demon', 'Speed Demon', 'Complete a lab in under 10 minutes', '⚡', 'speed', 'uncommon', 175, 
 '{"type": "fast_completion", "value": 600}'), -- 600 seconds = 10 minutes
('lightning_fast', 'Lightning Fast', 'Complete 5 labs in under 10 minutes each', '⚡⚡', 'speed', 'rare', 400, 
 '{"type": "speed_completions", "value": 5}'),

-- Perfection achievements
('perfectionist', 'Perfectionist', 'Complete a lab with 100% accuracy', '💯', 'perfection', 'uncommon', 125, 
 '{"type": "perfect_completion", "value": 1}'),
('flawless_five', 'Flawless Five', 'Complete 5 labs with 100% accuracy', '💎', 'perfection', 'rare', 350, 
 '{"type": "perfect_labs", "value": 5}'),

-- Skill-specific achievements
('network_ninja', 'Network Ninja', 'Complete all networking labs', '🥷', 'skill', 'rare', 300, 
 '{"type": "category_completion", "category": "networking", "value": 100}'),
('security_specialist', 'Security Specialist', 'Complete all cybersecurity labs', '🛡️', 'skill', 'rare', 300, 
 '{"type": "category_completion", "category": "cybersecurity", "value": 100}'),
('cloud_architect', 'Cloud Architect', 'Complete all cloud computing labs', '☁️', 'skill', 'rare', 300, 
 '{"type": "category_completion", "category": "cloud", "value": 100}'),

-- Special achievements
('early_bird', 'Early Bird', 'Log in before 6 AM', '🌅', 'special', 'uncommon', 100, 
 '{"type": "early_login", "value": 6}'),
('night_owl', 'Night Owl', 'Complete a lab after 10 PM', '🦉', 'special', 'uncommon', 100, 
 '{"type": "late_completion", "value": 22}'),
('weekend_warrior', 'Weekend Warrior', 'Complete labs on both Saturday and Sunday', '📅', 'special', 'uncommon', 150, 
 '{"type": "weekend_activity", "value": 2}')

ON CONFLICT (achievement_key) DO NOTHING;

-- Function to update user statistics after lab completion
CREATE OR REPLACE FUNCTION update_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user statistics
    INSERT INTO user_statistics (user_id, labs_completed, total_questions_answered, correct_answers, total_points_earned, last_activity_date, first_activity_date)
    VALUES (
        NEW.user_id, 
        1, 
        COALESCE(NEW.correct_submissions, 0),
        COALESCE(NEW.correct_submissions, 0),
        COALESCE(NEW.points_earned, 0),
        CURRENT_DATE,
        CURRENT_DATE
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        labs_completed = user_statistics.labs_completed + 1,
        total_questions_answered = user_statistics.total_questions_answered + COALESCE(NEW.total_questions, 0),
        correct_answers = user_statistics.correct_answers + COALESCE(NEW.correct_submissions, 0),
        total_points_earned = user_statistics.total_points_earned + COALESCE(NEW.points_earned, 0),
        last_activity_date = CURRENT_DATE,
        first_activity_date = COALESCE(user_statistics.first_activity_date, CURRENT_DATE),
        updated_at = CURRENT_TIMESTAMP;
    
    -- Update user table points
    UPDATE users 
    SET total_points = (
        SELECT total_points_earned 
        FROM user_statistics 
        WHERE user_id = NEW.user_id
    )
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update statistics when lab is completed
DROP TRIGGER IF EXISTS trigger_update_user_statistics ON lab_completions;
CREATE TRIGGER trigger_update_user_statistics
    AFTER INSERT OR UPDATE ON lab_completions
    FOR EACH ROW
    WHEN (NEW.is_completed = TRUE)
    EXECUTE FUNCTION update_user_statistics();

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(check_user_id INTEGER)
RETURNS TABLE(awarded_achievement_id INTEGER, achievement_name VARCHAR) AS $$
DECLARE
    achievement_record RECORD;
    user_stats RECORD;
    criteria_met BOOLEAN;
    awarded_count INTEGER := 0;
BEGIN
    -- Get user statistics
    SELECT * INTO user_stats FROM user_statistics WHERE user_id = check_user_id;
    
    -- If no stats record exists, create one
    IF user_stats IS NULL THEN
        INSERT INTO user_statistics (user_id) VALUES (check_user_id);
        SELECT * INTO user_stats FROM user_statistics WHERE user_id = check_user_id;
    END IF;
    
    -- Check each achievement
    FOR achievement_record IN 
        SELECT * FROM achievements 
        WHERE is_active = TRUE 
        AND id NOT IN (
            SELECT achievement_id 
            FROM user_achievements 
            WHERE user_id = check_user_id AND is_completed = TRUE
        )
    LOOP
        criteria_met := FALSE;
        
        -- Check different criteria types
        CASE achievement_record.criteria->>'type'
            WHEN 'labs_completed' THEN
                criteria_met := user_stats.labs_completed >= (achievement_record.criteria->>'value')::INTEGER;
            WHEN 'streak_days' THEN
                criteria_met := user_stats.current_streak_days >= (achievement_record.criteria->>'value')::INTEGER;
            WHEN 'perfect_labs' THEN
                criteria_met := user_stats.perfect_labs >= (achievement_record.criteria->>'value')::INTEGER;
            WHEN 'speed_completions' THEN
                criteria_met := user_stats.speed_completions >= (achievement_record.criteria->>'value')::INTEGER;
            WHEN 'total_points' THEN
                criteria_met := user_stats.total_points_earned >= (achievement_record.criteria->>'value')::INTEGER;
            WHEN 'modules_completed' THEN
                criteria_met := user_stats.modules_completed >= (achievement_record.criteria->>'value')::INTEGER;
            WHEN 'courses_completed' THEN
                criteria_met := user_stats.courses_completed >= (achievement_record.criteria->>'value')::INTEGER;
            -- Add more criteria types as needed
        END CASE;
        
        -- Award achievement if criteria met
        IF criteria_met THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            VALUES (check_user_id, achievement_record.id)
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            
            -- Return the awarded achievement
            awarded_achievement_id := achievement_record.id;
            achievement_name := achievement_record.name;
            awarded_count := awarded_count + 1;
            
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to update streak days
CREATE OR REPLACE FUNCTION update_user_streak(user_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    last_activity DATE;
    current_streak INTEGER := 0;
    longest_streak INTEGER := 0;
BEGIN
    -- Get user's last activity and current streaks
    SELECT last_activity_date, current_streak_days, longest_streak_days
    INTO last_activity, current_streak, longest_streak
    FROM user_statistics 
    WHERE user_id = user_id_param;
    
    -- Calculate new streak
    IF last_activity IS NULL THEN
        -- First activity
        current_streak := 1;
    ELSIF last_activity = CURRENT_DATE THEN
        -- Already logged today, no change
        current_streak := current_streak;
    ELSIF last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
        -- Consecutive day
        current_streak := current_streak + 1;
    ELSE
        -- Streak broken
        current_streak := 1;
    END IF;
    
    -- Update longest streak if needed
    IF current_streak > longest_streak THEN
        longest_streak := current_streak;
    END IF;
    
    -- Update user statistics
    UPDATE user_statistics 
    SET 
        current_streak_days = current_streak,
        longest_streak_days = longest_streak,
        last_activity_date = CURRENT_DATE,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = user_id_param;
    
    -- Update users table
    UPDATE users 
    SET streak_days = current_streak
    WHERE id = user_id_param;
    
    RETURN current_streak;
END;
$$ LANGUAGE plpgsql;

COMMIT;
