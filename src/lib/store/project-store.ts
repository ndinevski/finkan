import { create } from 'zustand';
import { db } from '../db/client';
import { Project } from '../db/types';
import { auth } from '../auth/client';
import { useTaskStore } from './task-store';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  fetchProjects: (workspaceId: string) => Promise<void>;
  fetchProject: (projectId: string) => Promise<void>;
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
  fetchProject: async (projectId: string) => {
    set({ isLoading: true });
    const result = await db.query<Project>(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );
    if (result.rows[0]) {
      set({ currentProject: result.rows[0], isLoading: false });
    }
  },
  createProject: async (workspaceId: string, name: string, description?: string) => {
    const { data: { user } } = await auth.getSession();
    if (!user) throw new Error('Not authenticated');

    // Start a transaction
    await db.query('BEGIN');

    try {
      // Create project
      const projectResult = await db.query<Project>(
        'INSERT INTO projects (workspace_id, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [workspaceId, name, description, user.id]
      );
      const project = projectResult.rows[0];

      // Create default columns using TaskStore
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