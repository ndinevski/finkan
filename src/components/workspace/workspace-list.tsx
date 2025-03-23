import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { Workspace } from "@/lib/db/types";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { DeleteWorkspaceDialog } from "./delete-workspace-dialog";
import { useToast } from "../ui/use-toast";
import { api } from "../../lib/api/client";

export function WorkspaceList() {
  const navigate = useNavigate();
  const { workspaces, fetchWorkspaces, setCurrentWorkspace, createWorkspace } =
    useWorkspaceStore();
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null
  );
  const { toast } = useToast();

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
      await createWorkspace(data);
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

  const handleDeleteWorkspace = async () => {
    if (!selectedWorkspace) return;

    setIsCreating(true);
    try {
      await api.deleteWorkspace(selectedWorkspace.id);
      await fetchWorkspaces();
      setIsDeleteDialogOpen(false);
      setSelectedWorkspace(null);
      toast({
        title: "Workspace deleted",
        description: "The workspace has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete workspace",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-light dark:text-text-dark">
          Workspaces
        </h2>
        <Button
          size="sm"
          onClick={() => setShowDialog(true)}
          className="bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Workspace
        </Button>
      </div>

      <div className="grid gap-4">
        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-2xl mr-3">{workspace.icon || "💼"}</span>
            <div className="text-left">
              <h3 className="font-medium text-text-light dark:text-text-dark">
                {workspace.name}
              </h3>
              {workspace.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {workspace.description}
                </p>
              )}
            </div>
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWorkspaceClick(workspace)}
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Open
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSelectedWorkspace(workspace);
                  setIsDeleteDialogOpen(true);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <CreateWorkspaceDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSubmit={handleCreateWorkspace}
        isLoading={isCreating}
      />

      <DeleteWorkspaceDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedWorkspace(null);
        }}
        onConfirm={handleDeleteWorkspace}
        workspaceName={selectedWorkspace?.name || ""}
        isLoading={isCreating}
      />
    </div>
  );
}
