import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { useProjectStore } from "@/lib/store/project-store";
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Folder,
  FolderOpen,
  File,
  PanelLeft,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface TreeItemProps {
  id: string;
  name: string;
  type: "workspace" | "project";
  isExpanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  isActive: boolean;
}

function TreeItem({
  id,
  name,
  type,
  isExpanded,
  onToggle,
  children,
  isActive,
}: TreeItemProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (type === "workspace") {
      navigate(`/workspace/${id}`);
    } else {
      navigate(`/board/${id}`);
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
          isActive && "bg-gray-100 dark:bg-gray-800"
        )}
        onClick={handleClick}
      >
        {type === "workspace" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        {type === "workspace" ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4" />
          ) : (
            <Folder className="h-4 w-4" />
          )
        ) : (
          <File className="h-4 w-4" />
        )}
        <span className="ml-1 text-sm">{name}</span>
      </div>
      {isExpanded && children && (
        <div className="ml-4 border-l border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set()
  );
  const { workspaces, currentWorkspace, fetchWorkspaces } = useWorkspaceStore();
  const { fetchProjects, getProjectsForWorkspace } = useProjectStore();
  const location = useLocation();
  const [projectsByWorkspace, setProjectsByWorkspace] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    const loadAllProjects = async () => {
      for (const workspace of workspaces) {
        if (!projectsByWorkspace[workspace.id]) {
          await fetchProjects(workspace.id);
          setProjectsByWorkspace((prev) => ({ ...prev, [workspace.id]: true }));
        }
      }
    };

    if (workspaces.length > 0) {
      loadAllProjects();
    }
  }, [workspaces, fetchProjects, projectsByWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchProjects(currentWorkspace.id);
    }
  }, [currentWorkspace, fetchProjects]);

  const toggleWorkspace = (workspaceId: string) => {
    setExpandedWorkspaces((prev) => {
      const next = new Set(prev);
      if (next.has(workspaceId)) {
        next.delete(workspaceId);
      } else {
        next.add(workspaceId);

        fetchProjects(workspaceId);
      }
      return next;
    });
  };

  const isWorkspaceActive = (workspaceId: string) => {
    return location.pathname.startsWith(`/workspace/${workspaceId}`);
  };

  const isProjectActive = (projectId: string) => {
    return location.pathname === `/board/${projectId}`;
  };

  const ownedWorkspaces = workspaces.filter(
    (workspace) => workspace.role === "owner"
  );
  const sharedWorkspaces = workspaces.filter(
    (workspace) => workspace.role !== "owner"
  );
  return (
    <>
      {isOpen && (
        <div className="fixed left-0 top-16 bottom-0 bg-surface-light dark:bg-surface-dark transition-all duration-300 z-10 w-64 border-r border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-4 h-full flex flex-col">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0"
              onClick={() => setIsOpen(false)}
            >
              <PanelLeft className="h-5 w-5" />
            </Button>

            <div className="h-px bg-gray-200 dark:bg-gray-700 mb-4 flex-shrink-0" />

            <div className="space-y-1 flex-grow overflow-y-auto pr-2 custom-scrollbar">
              <div className="px-2 py-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                Workspaces
              </div>
              <div className="space-y-4">
                <div>
                  <div className="px-2 py-1 text-xs font-medium text-gray-400 dark:text-gray-500">
                    Created By Me
                  </div>
                  <div className="space-y-1">
                    {ownedWorkspaces.length > 0 ? (
                      ownedWorkspaces.map((workspace) => (
                        <TreeItem
                          key={workspace.id}
                          id={workspace.id}
                          name={workspace.name}
                          type="workspace"
                          isExpanded={expandedWorkspaces.has(workspace.id)}
                          onToggle={() => toggleWorkspace(workspace.id)}
                          isActive={isWorkspaceActive(workspace.id)}
                        >
                          {expandedWorkspaces.has(workspace.id) &&
                            getProjectsForWorkspace(workspace.id).map(
                              (project) => (
                                <TreeItem
                                  key={project.id}
                                  id={project.id}
                                  name={project.name}
                                  type="project"
                                  isExpanded={false}
                                  onToggle={() => {}}
                                  isActive={isProjectActive(project.id)}
                                />
                              )
                            )}
                        </TreeItem>
                      ))
                    ) : (
                      <div className="pl-5 px-2 py-1 text-xs text-gray-400 dark:text-gray-500">
                        No workspaces
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="px-2 py-1 text-xs font-medium text-gray-400 dark:text-gray-500">
                    Shared with Me
                  </div>
                  <div className="space-y-1">
                    {sharedWorkspaces.length > 0 ? (
                      sharedWorkspaces.map((workspace) => (
                        <TreeItem
                          key={workspace.id}
                          id={workspace.id}
                          name={workspace.name}
                          type="workspace"
                          isExpanded={expandedWorkspaces.has(workspace.id)}
                          onToggle={() => toggleWorkspace(workspace.id)}
                          isActive={isWorkspaceActive(workspace.id)}
                        >
                          {expandedWorkspaces.has(workspace.id) &&
                            getProjectsForWorkspace(workspace.id).map(
                              (project) => (
                                <TreeItem
                                  key={project.id}
                                  id={project.id}
                                  name={project.name}
                                  type="project"
                                  isExpanded={false}
                                  onToggle={() => {}}
                                  isActive={isProjectActive(project.id)}
                                />
                              )
                            )}
                        </TreeItem>
                      ))
                    ) : (
                      <div className="pl-5 px-2 py-1 text-xs text-gray-400 dark:text-gray-500">
                        No workspaces
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {!isOpen && (
        <Button
          variant="ghost"
          size="sm"
          className="fixed left-4 top-20 z-20 bg-surface-light dark:bg-surface-dark rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
          onClick={() => setIsOpen(true)}
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      )}
    </>
  );
}
