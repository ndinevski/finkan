import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTaskStore } from "@/lib/store/task-store";
import { useProjectStore } from "@/lib/store/project-store";
import { Plus, MoreVertical, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "../layout/header";
import { db } from "@/lib/db/client";
import { Project } from "@/lib/db/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProjectBoardProps {
  isDark: boolean;
  onToggleDark: () => void;
}

const DEFAULT_COLUMNS = ["To Do", "In Progress", "Done"];

export function ProjectBoard({ isDark, onToggleDark }: ProjectBoardProps) {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const {
    columns,
    tasks,
    fetchColumns,
    createColumn,
    createDefaultColumns,
    createTask,
  } = useTaskStore();
  const { currentProject, archiveProject, setCurrentProject } =
    useProjectStore();
  const [newColumnName, setNewColumnName] = useState("");
  const [showNewColumn, setShowNewColumn] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (boardId) {
      // Fetch the current project
      db.query<Project>(
        "SELECT * FROM projects WHERE id = $1 AND is_archived = false",
        [boardId]
      )
        .then((result) => {
          if (!isMounted) return;
          if (result.rows.length > 0) {
            setCurrentProject(result.rows[0]);
          }
        })
        .catch(console.error);

      // Fetch columns
      fetchColumns(boardId)
        .then((result) => {
          if (!isMounted) return;

          // Only create default columns if there are no columns and it's not the test project
          if (
            result.rows.length === 0 &&
            boardId !== "00000000-0000-0000-0000-000000000003"
          ) {
            const defaultColumns = DEFAULT_COLUMNS.map((name, index) => ({
              name,
              position: index,
            }));
            return createDefaultColumns(boardId, defaultColumns);
          }
        })
        .catch(console.error);
    }

    return () => {
      isMounted = false;
    };
  }, [boardId, fetchColumns, createDefaultColumns, setCurrentProject]);

  const handleCreateColumn = async () => {
    if (!newColumnName.trim() || !boardId) return;
    await createColumn(boardId, newColumnName, columns.length);
    setNewColumnName("");
    setShowNewColumn(false);
  };

  const handleDeleteProject = async () => {
    if (!boardId) return;
    try {
      setIsDeleting(true);
      await archiveProject(boardId);
      navigate(-1);
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
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
                onClick={() => setShowNewColumn(true)}
                className="bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Column
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
            <div>
              <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
                {currentProject?.name}
              </h2>
              {currentProject?.description && (
                <p className="mt-1 text-gray-500 dark:text-gray-400 max-w-xl break-words whitespace-pre-wrap">
                  {currentProject.description}
                </p>
              )}
            </div>
          </div>

          <div className="h-full overflow-x-auto">
            <div className="flex gap-4 min-h-[calc(100vh-12rem)]">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="w-80 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-text-light dark:text-text-dark">
                      {column.name}
                    </h3>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {tasks
                      .filter((task) => task.column_id === column.id)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="bg-white dark:bg-gray-700 p-3 rounded shadow-sm"
                        >
                          <h4 className="font-medium text-text-light dark:text-text-dark">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 break-words whitespace-pre-wrap">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span
                              className={`px-2 py-1 rounded ${
                                task.priority === "high"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                  : task.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              }`}
                            >
                              {task.priority}
                            </span>
                            {task.due_date && (
                              <span className="ml-2">
                                Due:{" "}
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-500 dark:text-gray-400"
                      onClick={() =>
                        createTask(column.id, "New Task").catch(console.error)
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </div>
              ))}

              {showNewColumn ? (
                <div className="w-80 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <Input
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="Enter column name"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateColumn()}
                    className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px] bg-surface-light dark:bg-surface-dark border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-text-light dark:text-text-dark">
              Delete Project
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-text-light dark:text-text-dark">
              Are you sure you want to delete the project "
              {currentProject?.name}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-text-light dark:text-text-dark"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
