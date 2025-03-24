-- Migration: 003_add_column_constraints
-- Description: Add unique constraint to prevent duplicate column names within a project

-- Drop the constraint if it exists
ALTER TABLE columns DROP CONSTRAINT IF EXISTS unique_column_name_per_project;

-- Add unique constraint to columns table
ALTER TABLE columns ADD CONSTRAINT unique_column_name_per_project UNIQUE (project_id, name); 