import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTaskStore } from "@/lib/store/task-store";
import { Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProjectBoard() {
  const { boardId } = useParams<{ boardId: string }>();
  const { columns, tasks, fetchColumns, createColumn, createTask } =
    useTaskStore();
  const [newColumnName, setNewColumnName] = useState("");
  const [showNewColumn, setShowNewColumn] = useState(false);

  useEffect(() => {
    if (boardId) {
      fetchColumns(boardId).catch(console.error);
    }
  }, [boardId, fetchColumns]);

  const handleCreateColumn = async () => {
    if (!newColumnName.trim() || !boardId) return;
    await createColumn(boardId, newColumnName, columns.length);
    setNewColumnName("");
    setShowNewColumn(false);
  };

  return (
    <div className="h-full overflow-x-auto">
      <div className="flex gap-4 p-4 min-h-[calc(100vh-12rem)]">
        {columns.map((column) => (
          <div
            key={column.id}
            className="w-80 flex-shrink-0 bg-gray-100 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">{column.name}</h3>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {tasks
                .filter((task) => task.column_id === column.id)
                .map((task) => (
                  <div key={task.id} className="bg-white p-3 rounded shadow-sm">
                    <h4 className="font-medium">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <span
                        className={`px-2 py-1 rounded ${
                          task.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : task.priority === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <span className="ml-2">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-500"
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
          <div className="w-80 flex-shrink-0 bg-gray-100 rounded-lg p-4">
            <Input
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Enter column name"
              onKeyDown={(e) => e.key === "Enter" && handleCreateColumn()}
            />
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-80 flex-shrink-0 h-12"
            onClick={() => setShowNewColumn(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Column
          </Button>
        )}
      </div>
    </div>
  );
}
