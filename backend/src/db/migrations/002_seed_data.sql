-- Migration: 002_seed_data
-- Description: Add initial test data

-- Insert test user
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@example.com',
  'Test User',
  'admin'
) ON CONFLICT (email) DO UPDATE SET
  id = EXCLUDED.id,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Insert test workspace
INSERT INTO workspaces (id, name, icon, description, created_by)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Test Workspace',
  '💼',
  'This is a test workspace',
  '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  created_by = EXCLUDED.created_by;

-- Add test user as owner of the workspace
INSERT INTO workspace_members (workspace_id, profile_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'owner'
) ON CONFLICT (workspace_id, profile_id) DO UPDATE SET
  role = EXCLUDED.role;

-- Insert test project
INSERT INTO projects (id, workspace_id, name, description, created_by)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  'Test Project',
  'This is a test project',
  '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  created_by = EXCLUDED.created_by;

-- Insert default columns for the test project
INSERT INTO columns (id, project_id, name, position)
VALUES 
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'Todo', 0),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'In Progress', 1),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', 'Done', 2)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  position = EXCLUDED.position; 