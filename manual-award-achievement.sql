-- Example: Manually award "First Login" achievement to user ID 1002 (student3)

-- First, find the achievement ID
SELECT id, achievement_key, name FROM achievements WHERE achievement_key = 'first_login';

-- Award the achievement (replace USER_ID and ACHIEVEMENT_ID with actual values)
INSERT INTO user_achievements (user_id, achievement_id, earned_at) 
VALUES (1002, 1, NOW())
ON CONFLICT (user_id, achievement_id) DO NOTHING;

-- Check user's current achievements
SELECT 
  ua.earned_at,
  a.name,
  a.description,
  a.icon,
  a.points,
  a.rarity
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = 1002
ORDER BY ua.earned_at DESC;
