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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !email.trim()}>
              {isLoading ? "Inviting..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string }) => Promise<void>;
  isLoading: boolean;
}

function CreateProjectDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, description: description || undefined });
    setName("");
    setDescription("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-surface-light dark:bg-surface-dark border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-text-light dark:text-text-dark">
            Create New Project
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-text-light dark:text-text-dark"
            >
              Project Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium text-text-light dark:text-text-dark"
            >
              Description (Optional)
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
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
              disabled={isLoading || !name.trim()}
              className="bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white"
            >
              {isLoading ? "Creating..." : "Create Project"}
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

interface WorkspacePageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export function WorkspacePage({ isDark, onToggleDark }: WorkspacePageProps) {
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
    } catch (error) {
      console.error("Failed to create project:", error);
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
    } catch (error) {
      console.error("Failed to delete workspace:", error);
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
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col w-full">
      <Header
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate(-1)}
      />
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-start space-x-2">
              <Button
                onClick={() => setShowInviteDialog(true)}
                variant="outline"
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-text-light dark:text-text-dark"
              >
                <Users className="h-4 w-4 mr-2" />
                Invite
              </Button>
              <Button
                onClick={() => setShowCreateProjectDialog(true)}
                className="bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-start space-x-4 mb-8">
            <span className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 dark:bg-primary-light/10 flex items-center justify-center text-xl">
              {currentWorkspace.icon || "💼"}
            </span>
            <div>
              <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
                {currentWorkspace.name}
              </h2>
              {currentWorkspace.description && (
                <p className="mt-1 text-gray-500 dark:text-gray-400 max-w-xl break-words whitespace-pre-wrap">
                  {currentWorkspace.description}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-text-light dark:text-text-dark">
                Team Members
              </h3>
              <div className="bg-surface-light dark:bg-surface-dark shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                {members.map((member) => (
                  <div
                    key={member.profile_id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.full_name || member.email}
                          className="h-8 w-8 rounded-full mr-3"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {(member.full_name ||
                              member.email)[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-text-light dark:text-text-dark">
                          {member.full_name || member.email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {member.role}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-text-light dark:text-text-dark">
                Projects
              </h3>
              <div className="bg-surface-light dark:bg-surface-dark shadow rounded-lg p-4">
                <div className="flex flex-col gap-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-text-light dark:text-text-dark truncate">
                            {project.name}
                          </h4>
                          {project.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 break-words whitespace-pre-wrap line-clamp-2 overflow-hidden">
                              {project.description.length > 100
                                ? `${project.description.substring(0, 100)}...`
                                : project.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <Button
                            onClick={() => handleProjectClick(project.id)}
                            variant="ghost"
                            size="sm"
                            className="text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-600"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              setProjectToDelete(project);
                              setShowDeleteProjectDialog(true);
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    onClick={() => setShowCreateProjectDialog(true)}
                    variant="outline"
                    className="h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary-light hover:bg-gray-50 dark:hover:bg-gray-800 text-text-light dark:text-text-dark"
                  >
                    <Plus className="h-6 w-6 mr-2" />
                    Create New Project
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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
