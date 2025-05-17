import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { Workspace } from "@/lib/db/types";
import { Plus, Trash2 } from "lucide-react";
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

  console.log("Workspaces in state:", workspaces);

  const ownedWorkspaces = workspaces.filter(
    (workspace) => workspace.role === "owner"
  );
  const sharedWorkspaces = workspaces.filter(
    (workspace) => workspace.role !== "owner"
  );

  console.log("Owned workspaces:", ownedWorkspaces);
  console.log("Shared workspaces:", sharedWorkspaces);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        await fetchWorkspaces();
        console.log("Workspaces fetched successfully");
      } catch (error) {
        console.error("Error fetching workspaces:", error);
      }
    };

    loadWorkspaces();
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
      toast({
        title: "Success",
        description: "Workspace created successfully",
      });
    } catch (error) {
      console.error("Failed to create workspace:", error);
      toast({
        title: "Error",
        description: "Failed to create workspace",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    navigate(`/workspace/${workspace.id}`);
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    setIsCreating(true);
    try {
      await api.deleteWorkspace(workspaceId);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">
          Workspaces
        </h1>
        <Button
          onClick={() => setShowDialog(true)}
          className="bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Workspace
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold pb-4">Created By Me</h2>
          {ownedWorkspaces && ownedWorkspaces.length > 0 ? (
            ownedWorkspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="mb-2 flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-2xl mr-3">{workspace.icon || "💼"}</span>
                <div className="text-left">
                  <h3 className="font-medium text-text-light dark:text-text-dark">
                    {workspace.name}
                  </h3>
                  {workspace.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[300px]">
                      {workspace.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleWorkspaceClick(workspace)}
                    className="text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200"
                  >
                    Open Workspace
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedWorkspace(workspace);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="pl-5 px-2 py-1 text-xs text-gray-400 dark:text-gray-500">
              No workspaces
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold pb-4">Shared with Me</h2>
          {sharedWorkspaces && sharedWorkspaces.length > 0 ? (
            sharedWorkspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="mb-2 flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-2xl mr-3">{workspace.icon || "💼"}</span>
                <div className="text-left">
                  <h3 className="font-medium text-text-light dark:text-text-dark">
                    {workspace.name}
                  </h3>
                  {workspace.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[300px]">
                      {workspace.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleWorkspaceClick(workspace)}
                    className="text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200"
                  >
                    Open Workspace
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedWorkspace(workspace);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="pl-5 px-2 py-1 text-xs text-gray-400 dark:text-gray-500">
              No workspaces
            </div>
          )}
        </div>
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
        onSubmit={async () => {
          if (selectedWorkspace) {
            await handleDeleteWorkspace(selectedWorkspace.id);
          }
        }}
        isLoading={isCreating}
        workspaceName={selectedWorkspace?.name || ""}
      />
    </div>
  );
}
