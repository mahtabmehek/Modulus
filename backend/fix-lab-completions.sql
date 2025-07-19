-- Add the missing updated_at column to lab_completions table
ALTER TABLE lab_completions 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have a timestamp
UPDATE lab_completions 
SET updated_at = COALESCE(completed_at, started_at, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;
