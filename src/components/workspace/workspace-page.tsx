import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Plus,
  Users,
  Settings,
  ArrowLeft,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { useProjectStore } from "@/lib/store/project-store";
import { Project } from "@/lib/db/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Header } from "../layout/header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { DeleteWorkspaceDialog } from "./delete-workspace-dialog";
import { useToast } from "../ui/use-toast";
import { CreateProjectDialog } from "./create-project-dialog";

interface InviteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
  isLoading: boolean;
}

function InviteMemberDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email);
    setEmail("");
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-surface-light dark:bg-surface-dark border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-text-light dark:text-text-dark">
            Invite Team Member
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-text-light dark:text-text-dark"
            >
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-text-light dark:text-text-dark"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white"
            >
              {isLoading ? "Inviting..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
  projectName: string;
}

function DeleteProjectDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  projectName,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-surface-light dark:bg-surface-dark border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-text-light dark:text-text-dark">
            Delete Project
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-text-light dark:text-text-dark">
            Are you sure you want to delete the project "{projectName}"? This
            action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-text-light dark:text-text-dark"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onSubmit}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
          >
            {isLoading ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const {
    currentWorkspace,
    members,
    projects,
    fetchWorkspace,
    fetchMembers,
    fetchProjects,
    inviteMember,
    createProject,
    deleteWorkspace,
  } = useWorkspaceStore();
  const { archiveProject } = useProjectStore();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspace(workspaceId).catch(console.error);
      fetchMembers(workspaceId).catch(console.error);
      fetchProjects(workspaceId).catch(console.error);
    }
  }, [workspaceId, fetchWorkspace, fetchMembers, fetchProjects]);

  if (!currentWorkspace) {
    return <div>Loading...</div>;
  }

  const handleInviteMember = async (email: string) => {
    if (!workspaceId) return;
    try {
      setIsInviting(true);
      await inviteMember(workspaceId, email);
      setShowInviteDialog(false);
    } catch (error) {
      console.error("Failed to invite member:", error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCreateProject = async (data: {
    name: string;
    description?: string;
  }) => {
    if (!workspaceId) return;
    try {
      setIsCreatingProject(true);
      await createProject(workspaceId, data.name, data.description);
      setShowCreateProjectDialog(false);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    } catch (error) {
      console.error("Failed to create project:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/board/${projectId}`);
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceId) return;
    try {
      setIsDeleting(true);
      await deleteWorkspace(workspaceId);
      navigate("/");
      toast({
        title: "Success",
        description: "Workspace deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete workspace:", error);
      toast({
        title: "Error",
        description: "Failed to delete workspace",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || !workspaceId) return;
    try {
      setIsDeletingProject(true);
      await archiveProject(projectToDelete.id);
      await fetchProjects(workspaceId);
      setShowDeleteProjectDialog(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setIsDeletingProject(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">
              {currentWorkspace.name}
            </h1>
            {currentWorkspace.description && (
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {currentWorkspace.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-light dark:text-text-dark">
              Projects
            </h2>
            <Button
              onClick={() => setShowCreateProjectDialog(true)}
              size="sm"
              className="bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="text-left flex-grow">
                  <h3 className="font-medium text-text-light dark:text-text-dark">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {project.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleProjectClick(project.id)}
                    className="text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setProjectToDelete(project);
                      setShowDeleteProjectDialog(true);
                    }}
                    className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-light dark:text-text-dark">
              Team Members
            </h2>
            <Button
              onClick={() => setShowInviteDialog(true)}
              size="sm"
              className="bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </div>
          <div className="grid gap-4">
            {members.map((member) => (
              <div
                key={`${member.workspace_id}-${member.profile_id}`}
                className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark"
              >
                <div className="flex items-center gap-3">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name || ""}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {member.full_name
                          ? member.full_name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                          : "?"}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-text-light dark:text-text-dark">
                      {member.email.split("@")[0] || member.email || "User"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {member.email}
                    </p>
                  </div>
                </div>
                <div className="ml-auto">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {member.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <InviteMemberDialog
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onSubmit={handleInviteMember}
        isLoading={isInviting}
      />

      <CreateProjectDialog
        isOpen={showCreateProjectDialog}
        onClose={() => setShowCreateProjectDialog(false)}
        onSubmit={handleCreateProject}
        isLoading={isCreatingProject}
      />

      <DeleteWorkspaceDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onSubmit={handleDeleteWorkspace}
        isLoading={isDeleting}
        workspaceName={currentWorkspace.name}
      />

      <DeleteProjectDialog
        isOpen={showDeleteProjectDialog}
        onClose={() => {
          setShowDeleteProjectDialog(false);
          setProjectToDelete(null);
        }}
        onSubmit={handleDeleteProject}
        isLoading={isDeletingProject}
        projectName={projectToDelete?.name || ""}
      />
    </div>
  );
}
