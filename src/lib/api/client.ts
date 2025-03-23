import { API_BASE_URL } from "../config";

export const api = {
  async createWorkspace(data: { name: string; icon?: string; description?: string }) {
    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create workspace");
    }

    return response.json();
  },

  async deleteWorkspace(id: string) {
    const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete workspace");
    }

    return response.json();
  },
}; 