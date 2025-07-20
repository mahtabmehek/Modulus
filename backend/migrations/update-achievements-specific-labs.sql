-- Migration to add specific lab completion checking for achievements
-- This extends the existing achievements system to support checking specific labs

-- Create function to check if specific labs are completed by a user
CREATE OR REPLACE FUNCTION check_specific_labs_completed(
    check_user_id INTEGER,
    lab_ids INTEGER[]
) RETURNS BOOLEAN AS $$
DECLARE
    completed_count INTEGER;
BEGIN
    -- Count how many of the specified labs the user has completed
    SELECT COUNT(DISTINCT lab_id) INTO completed_count
    FROM submissions s
    WHERE s.user_id = check_user_id 
    AND s.lab_id = ANY(lab_ids)
    AND s.status = 'completed';
    
    -- Return true if all specified labs are completed
    RETURN completed_count = array_length(lab_ids, 1);
END;
$$ LANGUAGE plpgsql;

-- Update the check_achievements function to handle specific lab completion
CREATE OR REPLACE FUNCTION check_achievements(check_user_id INTEGER)
RETURNS TABLE(
    awarded_achievement_id INTEGER,
    achievement_name TEXT,
    awarded_count INTEGER
) AS $$
DECLARE
    achievement_record RECORD;
    user_stats RECORD;
    criteria_met BOOLEAN;
    specific_labs INTEGER[];
BEGIN
    awarded_count := 0;
    
    -- Get user statistics
    SELECT 
        COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.lab_id END) as labs_completed,
        COUNT(DISTINCT CASE WHEN s.status = 'completed' AND s.score = 100 THEN s.lab_id END) as perfect_labs,
        COUNT(DISTINCT CASE WHEN s.status = 'completed' AND s.completion_time <= 300 THEN s.lab_id END) as speed_completions,
        COALESCE(SUM(CASE WHEN s.status = 'completed' THEN s.points_earned ELSE 0 END), 0) as total_points_earned,
        COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.module_id END) as modules_completed,
        COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN c.id END) as courses_completed,
        GREATEST(
            COALESCE(u.current_streak_days, 0),
            COALESCE(
                (SELECT COUNT(*) FROM (
                    SELECT DISTINCT DATE(s.completed_at) as completion_date
                    FROM submissions s 
                    WHERE s.user_id = check_user_id 
                    AND s.status = 'completed'
                    AND s.completed_at >= CURRENT_DATE - INTERVAL '30 days'
                    ORDER BY completion_date DESC
                ) consecutive_days), 0)
        ) as current_streak_days
    INTO user_stats
    FROM users u
    LEFT JOIN submissions s ON s.user_id = u.id
    LEFT JOIN labs l ON s.lab_id = l.id
    LEFT JOIN modules m ON l.module_id = m.id
    LEFT JOIN courses c ON m.course_id = c.id
    WHERE u.id = check_user_id
    GROUP BY u.id, u.current_streak_days;

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
                -- Check if specific labs are required
                IF achievement_record.criteria ? 'labs' THEN
                    -- Extract lab IDs from criteria
                    SELECT ARRAY(
                        SELECT jsonb_array_elements_text(achievement_record.criteria->'labs')::INTEGER
                    ) INTO specific_labs;
                    
                    -- Check if all specific labs are completed
                    criteria_met := check_specific_labs_completed(check_user_id, specific_labs);
                ELSE
                    -- General lab completion count check
                    criteria_met := user_stats.labs_completed >= (achievement_record.criteria->>'value')::INTEGER;
                END IF;
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

-- Update the trigger function to call achievement check on lab completion
CREATE OR REPLACE FUNCTION trigger_check_achievements()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check achievements when a submission is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        PERFORM check_achievements(NEW.user_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
