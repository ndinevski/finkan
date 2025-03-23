import { create } from 'zustand';
import { db } from '../db/client';
import { Workspace, WorkspaceMember, Profile, Project } from '../db/types';
import { auth } from '../auth/client';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  members: WorkspaceMember[];
  projects: Project[];
  isLoading: boolean;
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspace: (id: string) => Promise<void>;
  createWorkspace: (name: string, icon?: string, description?: string) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  fetchMembers: (workspaceId: string) => Promise<void>;
  inviteMember: (workspaceId: string, email: string, role?: WorkspaceMember['role']) => Promise<void>;
  fetchProjects: (workspaceId: string) => Promise<void>;
  createProject: (workspaceId: string, name: string, description?: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  members: [],
  projects: [],
  isLoading: false,
  fetchWorkspaces: async () => {
    set({ isLoading: true });
    const result = await db.query<Workspace>('SELECT * FROM workspaces ORDER BY created_at DESC');
    set({ workspaces: result.rows, isLoading: false });
  },
  fetchWorkspace: async (id: string) => {
    set({ isLoading: true });
    const result = await db.query<Workspace>('SELECT * FROM workspaces WHERE id = $1', [id]);
    if (result.rows[0]) {
      set({ currentWorkspace: result.rows[0], isLoading: false });
    }
  },
  createWorkspace: async (name: string, icon?: string, description?: string) => {
    const { data: { user } } = await auth.getSession();
    if (!user) throw new Error('Not authenticated');

    await db.query(
      'INSERT INTO workspaces (name, icon, description, created_by) VALUES ($1, $2, $3, $4)',
      [name, icon || '💼', description, user.id]
    );
    await get().fetchWorkspaces();
  },
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  fetchMembers: async (workspaceId: string) => {
    const result = await db.query<WorkspaceMember & { profile: Profile }>(
      `SELECT wm.*, p.email, p.full_name, p.avatar_url 
       FROM workspace_members wm 
       JOIN profiles p ON wm.profile_id = p.id 
       WHERE wm.workspace_id = $1`,
      [workspaceId]
    );
    set({ members: result.rows });
  },
  inviteMember: async (workspaceId: string, email: string, role = 'member') => {
    const profileResult = await db.query<Profile>(
      'SELECT id FROM profiles WHERE email = $1',
      [email]
    );
    if (!profileResult.rows[0]) throw new Error('User not found');

    await db.query(
      'INSERT INTO workspace_members (workspace_id, profile_id, role) VALUES ($1, $2, $3)',
      [workspaceId, profileResult.rows[0].id, role]
    );
    await get().fetchMembers(workspaceId);
  },
  fetchProjects: async (workspaceId: string) => {
    const result = await db.query<Project>(
      'SELECT * FROM projects WHERE workspace_id = $1 AND is_archived = false ORDER BY created_at DESC',
      [workspaceId]
    );
    set({ projects: result.rows });
  },
  createProject: async (workspaceId: string, name: string, description?: string) => {
    const { data: { user } } = await auth.getSession();
    if (!user) throw new Error('Not authenticated');

    await db.query(
      'INSERT INTO projects (workspace_id, name, description, created_by) VALUES ($1, $2, $3, $4)',
      [workspaceId, name, description, user.id]
    );
    await get().fetchProjects(workspaceId);
  },
}));