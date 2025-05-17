import { create } from 'zustand';
import { db } from '../db/client';
import { Project } from '../db/types';
import { auth } from '../auth/client';
import { useTaskStore } from './task-store';

interface ProjectState {
  projects: Project[];
  projectsByWorkspace: Record<string, Project[]>;
  currentProject: Project | null;
  isLoading: boolean;
  projectsLoadedWorkspaces: string[];  
  fetchProjects: (workspaceId: string) => Promise<void>;
  fetchProject: (projectId: string) => Promise<void>;
  createProject: (workspaceId: string, name: string, description?: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  archiveProject: (projectId: string) => Promise<void>;
  getProjectsForWorkspace: (workspaceId: string) => Project[];
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  projectsByWorkspace: {},
  currentProject: null,
  isLoading: false,
  projectsLoadedWorkspaces: [],
  
  fetchProjects: async (workspaceId: string) => {

    const { projectsLoadedWorkspaces } = get();
    
    set({ isLoading: true });
    try {
      const result = await db.query<Project>(
        'SELECT * FROM projects WHERE workspace_id = $1 AND is_archived = false ORDER BY created_at DESC',
        [workspaceId]
      );      
      

      const workspaceProjects = result.rows;
      
      set(state => {

        const updatedProjectsByWorkspace = {
          ...state.projectsByWorkspace,
          [workspaceId]: workspaceProjects
        };
        

        const updatedProjects = [
          ...state.projects.filter(p => p.workspace_id !== workspaceId), 
          ...workspaceProjects
        ];
        
        return { 
          projects: updatedProjects,
          projectsByWorkspace: updatedProjectsByWorkspace,
          isLoading: false,
          projectsLoadedWorkspaces: projectsLoadedWorkspaces.includes(workspaceId) 
            ? projectsLoadedWorkspaces 
            : [...projectsLoadedWorkspaces, workspaceId]
        };
      });
    } catch (error) {
      set({ isLoading: false });
      console.error('Error fetching projects:', error);
    }
  },
  
  getProjectsForWorkspace: (workspaceId: string) => {
    const { projectsByWorkspace } = get();
    return projectsByWorkspace[workspaceId] || [];
  },
  
  fetchProject: async (projectId: string) => {
    set({ isLoading: true });
    try {
      const result = await db.query<Project>(
        'SELECT * FROM projects WHERE id = $1',
        [projectId]
      );
      if (result.rows[0]) {
        set({ currentProject: result.rows[0], isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
      console.error('Error fetching project:', error);
    }
  },
  
  createProject: async (workspaceId: string, name: string, description?: string) => {
    const { data: { user } } = await auth.getSession();
    if (!user) throw new Error('Not authenticated');


    await db.query('BEGIN');

    try {

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
  
  setCurrentProject: (project) => set({ currentProject: project }),
    archiveProject: async (projectId: string) => {
    const { projects, currentProject } = get();
    

    const projectToArchive = projects.find(p => p.id === projectId);
    if (!projectToArchive) return;
    
    const workspaceId = projectToArchive.workspace_id;
    
    await db.query(
      'UPDATE projects SET is_archived = true WHERE id = $1',
      [projectId]
    );
    
    if (currentProject?.id === projectId) {
      set({ currentProject: null });
    }
    

    set(state => ({
      projects: state.projects.filter(p => p.id !== projectId),
      projectsByWorkspace: {
        ...state.projectsByWorkspace,
        [workspaceId]: (state.projectsByWorkspace[workspaceId] || []).filter(p => p.id !== projectId)
      }
    }));
  },
}));