import { Database } from './types';
import { fetchWithAuth } from '../api/fetch-client';


async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return fetchWithAuth<T>(endpoint, options);
}

export const db = {
  query: async <T>(text: string, params?: any[]): Promise<{ rows: T[] }> => {
    try {
      const response = await fetchApi('/query', {
        method: 'POST',
        body: JSON.stringify({ query: text, params }),
      });
      return response;
    } catch (error) {
      console.error(`DB query error: ${text}`, error);
      throw error;
    }
  },


  async getProfile(id: string) {
    const response = await fetchApi(`/profiles/${id}`);
    return response;
  },

  async getWorkspace(id: string) {
    const response = await fetchApi(`/workspaces/${id}`);
    return response;
  },

  async getProject(id: string) {
    const response = await fetchApi(`/projects/${id}`);
    return response;
  },

  async getTask(id: string) {
    const response = await fetchApi(`/tasks/${id}`);
    return response;
  },  async getWorkspaceMembers(workspaceId: string) {
    const response = await fetchApi(`/workspaces/${workspaceId}/members`);
    return response;
  },

  async getProjectColumns(projectId: string) {
    const response = await fetchApi(`/projects/${projectId}/columns`);
    return response;
  },

  async getColumnTasks(columnId: string) {
    const response = await fetchApi(`/columns/${columnId}/tasks`);
    return response;
  }
};