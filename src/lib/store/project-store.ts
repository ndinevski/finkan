import { create } from 'zustand';
import { db } from '../db/client';
import { Project } from '../db/types';
import { auth } from '../auth/client';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  fetchProjects: (workspaceId: string) => Promise<void>;
  createProject: (workspaceId: string, name: string, description?: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  archiveProject: (projectId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  fetchProjects: async (workspaceId: string) => {
    set({ isLoading: true });
    const result = await db.query<Project>(
      'SELECT * FROM projects WHERE workspace_id = $1 AND is_archived = false ORDER BY created_at DESC',
      [workspaceId]
    );
    set({ projects: result.rows, isLoading: false });
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
  setCurrentProject: (project) => set({ currentProject: project }),
  archiveProject: async (projectId: string) => {
    await db.query(
      'UPDATE projects SET is_archived = true WHERE id = $1',
      [projectId]
    );
    const currentProject = get().currentProject;
    if (currentProject?.id === projectId) {
      set({ currentProject: null });
    }
    if (currentProject) {
      await get().fetchProjects(currentProject.workspace_id);
    }
  },
}));