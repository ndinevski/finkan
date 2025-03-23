import { Database } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

export const db = {
  query: async <T>(text: string, params?: any[]): Promise<{ rows: T[] }> => {
    const response = await fetchApi('/api/query', {
      method: 'POST',
      body: JSON.stringify({ query: text, params }),
    });
    return response;
  },

  // Helper functions for common operations
  async getProfile(id: string) {
    const response = await fetchApi(`/api/profiles/${id}`);
    return response;
  },

  async getWorkspace(id: string) {
    const response = await fetchApi(`/api/workspaces/${id}`);
    return response;
  },

  async getProject(id: string) {
    const response = await fetchApi(`/api/projects/${id}`);
    return response;
  },

  async getTask(id: string) {
    const response = await fetchApi(`/api/tasks/${id}`);
    return response;
  },

  async getWorkspaceMembers(workspaceId: string) {
    const response = await fetchApi(`/api/workspaces/${workspaceId}/members`);
    return response;
  },

  async getProjectColumns(projectId: string) {
    const response = await fetchApi(`/api/projects/${projectId}/columns`);
    return response;
  },

  async getColumnTasks(columnId: string) {
    const response = await fetchApi(`/api/columns/${columnId}/tasks`);
    return response;
  }
};