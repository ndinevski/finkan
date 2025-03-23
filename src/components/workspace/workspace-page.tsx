import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Users, Settings } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Project Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
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
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
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
  } = useWorkspaceStore();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

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

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <header className="bg-surface-light dark:bg-surface-dark shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-2">
                {currentWorkspace.icon || "💼"}
              </span>
              <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">
                {currentWorkspace.name}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowInviteDialog(true)}
                variant="outline"
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Users className="h-4 w-4 mr-2" />
                Invite
              </Button>
              <Button
                onClick={() => setShowCreateProjectDialog(true)}
                className="bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
              <Button variant="ghost">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-text-light dark:text-text-dark">
              Team Members
            </h2>
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
                          {(member.full_name || member.email)[0].toUpperCase()}
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
            <h2 className="text-lg font-semibold mb-4">Projects</h2>
            <div className="bg-white shadow rounded-lg p-4">
              <div className="grid gap-4">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectClick(project.id)}
                    className="text-left p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-medium">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {project.description}
                      </p>
                    )}
                  </button>
                ))}
                <Button
                  onClick={() => setShowCreateProjectDialog(true)}
                  variant="outline"
                  className="h-24"
                >
                  <Plus className="h-6 w-6 mr-2" />
                  Create New Project
                </Button>
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
    </div>
  );
}
