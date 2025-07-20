-- Add metadata columns to tasks and questions tables
-- This allows flexible storage of additional properties without schema changes

-- Add metadata to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add metadata to questions table  
ALTER TABLE questions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create indexes on metadata columns for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_metadata ON tasks USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_questions_metadata ON questions USING GIN (metadata);

-- Add some example metadata for demonstration
UPDATE tasks SET metadata = jsonb_build_object(
  'difficulty', 'intermediate',
  'estimatedTime', 15,
  'tags', jsonb_build_array('networking', 'security'),
  'customFields', jsonb_build_object(
    'instructor_notes', 'Focus on practical implementation',
    'learning_objectives', jsonb_build_array('Understand firewall rules', 'Configure NAT')
  )
) WHERE metadata = '{}' AND id <= 3;

UPDATE questions SET metadata = jsonb_build_object(
  'points', 10,
  'difficulty', 'easy',
  'hint', 'Think about the OSI model',
  'explanation', 'This question tests basic networking knowledge'
) WHERE metadata = '{}' AND id <= 3;
