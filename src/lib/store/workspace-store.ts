import { create } from 'zustand';
import { db } from '../db/client';
import { Workspace, WorkspaceMember, Profile, Project } from '../db/types';
import { auth } from '../auth/client';
import { api } from '../api/client';
import { API_BASE_URL } from "../config";
import { useTaskStore } from './task-store';
import { fetchWithAuth } from '../api/fetch-client';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  members: WorkspaceMember[];
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspace: (id: string) => Promise<void>;
  createWorkspace: (data: { name: string; icon?: string; description?: string }) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  fetchMembers: (workspaceId: string) => Promise<void>;
  inviteMember: (workspaceId: string, email: string, role?: WorkspaceMember['role']) => Promise<void>;
  fetchProjects: (workspaceId: string) => Promise<void>;
  createProject: (workspaceId: string, name: string, description?: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  members: [],
  projects: [],
  isLoading: false,
  error: null,
  
  fetchWorkspaces: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await fetchWithAuth(`${API_BASE_URL}/workspaces`);
      if (!data) {
        throw new Error("Failed to fetch workspaces");
      }
      
      // Check if the data is an array and has items
      if (Array.isArray(data) && data.length > 0) {
        set({ workspaces: data });
        console.log("Workspaces set in store:", data);
        
        // After loading workspaces, fetch projects for all of them
        const { fetchProjects } = get();
        for (const workspace of data) {
          // We don't await here to allow parallel loading
          fetchProjects(workspace.id).catch(err => 
            console.error(`Error loading projects for workspace ${workspace.id}:`, err)
          );
        }
      } else {
        console.warn("API returned empty or invalid workspaces array:", data);
        set({ workspaces: [] });
      }
    } catch (error) {
      console.error("Error in fetchWorkspaces:", error);
      set({ error: error instanceof Error ? error.message : "Failed to fetch workspaces" });
    } finally {
      set({ isLoading: false });
    }
  },
  fetchWorkspace: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const result = await db.query<Workspace>('SELECT * FROM workspaces WHERE id = $1', [id]);
      if (result.rows[0]) {
        set({ currentWorkspace: result.rows[0] });
        console.log("Current workspace set:", result.rows[0]);
      } else {
        console.log("Workspace not found:", id);
      }
    } catch (error) {
      console.error("Error fetching workspace:", error);
      set({ error: error instanceof Error ? error.message : "Failed to fetch workspace" });
    } finally {
      set({ isLoading: false });
    }
  },
  createWorkspace: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const workspace = await api.createWorkspace(data);
      console.log("Created workspace:", workspace);
      
      // Ensure the role is set to 'owner' for newly created workspaces
      if (!workspace.role) {
        workspace.role = 'owner';
      }
      
      set((state) => {
        const updatedWorkspaces = [...state.workspaces, workspace];
        console.log("Updated workspaces after creation:", updatedWorkspaces);
        return { workspaces: updatedWorkspaces };
      });
    } catch (error) {
      console.error("Error creating workspace:", error);
      set({ error: error instanceof Error ? error.message : "Failed to create workspace" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
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
  },  createProject: async (workspaceId: string, name: string, description?: string) => {
    const { data: { user } } = await auth.getSession();
    if (!user) throw new Error('Not authenticated');

    await db.query('BEGIN');

    try {
      // Create project
      const projectResult = await db.query<Project>(
        'INSERT INTO projects (workspace_id, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [workspaceId, name, description, user.id]
      );
      const project = projectResult.rows[0];

      const taskStore = useTaskStore.getState();
      await taskStore.createDefaultColumns(project.id, [
        { name: 'To Do', position: 0 },
        { name: 'In Progress', position: 1 },
        { name: 'Done', position: 2 },
      ]);

      await db.query('COMMIT');
      await get().fetchProjects(workspaceId);
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  },
  deleteWorkspace: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await api.deleteWorkspace(id);
      set((state) => ({
        workspaces: state.workspaces.filter((w) => w.id !== id),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to delete workspace" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));