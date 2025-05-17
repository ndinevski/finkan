import { fetchWithAuth } from "./fetch-client";

export const api = {
  async createWorkspace(data: { name: string; icon?: string; description?: string }) {
    try {
      return await fetchWithAuth('/workspaces', {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Failed to create workspace:", error);
      throw new Error((error as any).message || "Failed to create workspace");
    }
  },

  async deleteWorkspace(id: string) {
    try {
      return await fetchWithAuth(`/workspaces/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error(`Failed to delete workspace ${id}:`, error);
      throw new Error((error as any).message || "Failed to delete workspace");
    }
  },
}; 