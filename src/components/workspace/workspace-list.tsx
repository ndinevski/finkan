import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { Workspace } from "@/lib/db/types";
import { Plus, Folder } from "lucide-react";
import { Button } from "../ui/button";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";

export function WorkspaceList() {
  const navigate = useNavigate();
  const { workspaces, fetchWorkspaces, setCurrentWorkspace, createWorkspace } =
    useWorkspaceStore();
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    fetchWorkspaces().catch(console.error);
  }, [fetchWorkspaces]);

  const handleCreateWorkspace = async (data: {
    name: string;
    icon: string;
    description: string;
  }) => {
    try {
      setIsCreating(true);
      await createWorkspace(data.name, data.icon, data.description);
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to create workspace:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    navigate(`/workspace/${workspace.id}`);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Workspaces</h2>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Workspace
        </Button>
      </div>

      <div className="grid gap-4">
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            onClick={() => handleWorkspaceClick(workspace)}
            className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mr-3">{workspace.icon || "💼"}</span>
            <div className="text-left">
              <h3 className="font-medium">{workspace.name}</h3>
              {workspace.description && (
                <p className="text-sm text-gray-500">{workspace.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      <CreateWorkspaceDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSubmit={handleCreateWorkspace}
        isLoading={isCreating}
      />
    </div>
  );
}
