-- Add missing columns to labs table
ALTER TABLE labs ADD COLUMN IF NOT EXISTS icon_path VARCHAR(500);
ALTER TABLE labs ADD COLUMN IF NOT EXISTS tags TEXT[];
