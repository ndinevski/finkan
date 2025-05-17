export type UserRole = 'admin' | 'staff' | 'student' | 'member';
export type WorkspaceRole = 'owner' | 'admin' | 'member';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  created_by: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  role: WorkspaceRole;
}

export interface WorkspaceMember {
  workspace_id: string;
  profile_id: string;
  role: WorkspaceRole;
  created_at: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  profile_role: UserRole;
  profile_created_at: string;
  profile_updated_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_by: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  project_id: string;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Database {
  profiles: Profile;
  workspaces: Workspace;
  workspace_members: WorkspaceMember;
  projects: Project;
  columns: Column;
  tasks: Task;
} 