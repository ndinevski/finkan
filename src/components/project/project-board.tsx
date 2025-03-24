import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTaskStore } from "@/lib/store/task-store";
import { useProjectStore } from "@/lib/store/project-store";
import { Plus, MoreVertical, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

export function ProjectBoard() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const {
    tasks,
    columns,
    fetchTasks,
    fetchColumns,
    createTask,
    updateTaskStatus,
    updateTaskDetails,
    createColumn,
    createDefaultColumns,
    updateColumnPosition,
  } = useTaskStore();
  const { currentProject, fetchProject, archiveProject } = useProjectStore();
  const [showNewColumn, setShowNewColumn] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (boardId) {
      fetchProject(boardId).catch(console.error);
      fetchColumns(boardId).catch(console.error);
    }
  }, [boardId, fetchProject, fetchColumns]);

  useEffect(() => {
    if (columns.length > 0) {
      fetchTasks(columns.map((col) => col.id)).catch(console.error);
    }
  }, [columns, fetchTasks]);

  const handleCreateColumn = async () => {
    if (!boardId || !newColumnName.trim()) return;
    try {
      setIsCreatingColumn(true);
      const position = columns.length;
      await createColumn(boardId, newColumnName, position);
      setNewColumnName("");
      setShowNewColumn(false);
      toast({
        title: "Success",
        description: "Column created successfully",
      });
    } catch (error) {
      console.error("Failed to create column:", error);
      toast({
        title: "Error",
        description: "Failed to create column",
        variant: "destructive",
      });
    } finally {
      setIsCreatingColumn(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!boardId) return;
    try {
      setIsDeleting(true);
      await archiveProject(boardId);
      navigate(-1);
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
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
              {currentProject?.name}
            </h1>
            {currentProject?.description && (
              <p className="mt-1 text-gray-500 dark:text-gray-400 max-w-xl break-words whitespace-pre-wrap">
                {currentProject.description}
              </p>
            )}
          </div>
        </div>
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
                      className="p-3 bg-white dark:bg-gray-700 rounded-md shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("taskId", task.id);
                        e.dataTransfer.setData("sourceColumnId", column.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add(
                          "ring-2",
                          "ring-primary",
                          "dark:ring-primary-light"
                        );
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove(
                          "ring-2",
                          "ring-primary",
                          "dark:ring-primary-light"
                        );
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove(
                          "ring-2",
                          "ring-primary",
                          "dark:ring-primary-light"
                        );
                        const taskId = e.dataTransfer.getData("taskId");
                        const sourceColumnId =
                          e.dataTransfer.getData("sourceColumnId");
                        if (taskId && sourceColumnId !== column.id) {
                          const tasksInColumn = tasks.filter(
                            (t) => t.column_id === column.id
                          );
                          await updateTaskStatus(
                            taskId,
                            column.id,
                            tasksInColumn.length
                          );
                        }
                      }}
                    >
                      <h4 className="font-medium text-text-light dark:text-text-dark">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {task.description}
                        </p>
                      )}
                      {task.due_date && (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showNewColumn} onOpenChange={setShowNewColumn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="columnName"
                className="text-sm font-medium text-text-light dark:text-text-dark"
              >
                Column Name
              </label>
              <Input
                id="columnName"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Enter column name"
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewColumn(false)}
                disabled={isCreatingColumn}
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-text-light dark:text-text-dark"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateColumn}
                disabled={isCreatingColumn || !newColumnName.trim()}
                className="bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white"
              >
                {isCreatingColumn ? "Creating..." : "Create Column"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this project? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
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
