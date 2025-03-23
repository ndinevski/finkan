import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface DeleteWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
  workspaceName: string;
}

export function DeleteWorkspaceDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  workspaceName,
}: DeleteWorkspaceDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-surface-light dark:bg-surface-dark border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-text-light dark:text-text-dark">
            Delete Workspace
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Are you sure you want to delete the workspace "{workspaceName}"?
            This action cannot be undone.
          </p>
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <Trash2 className="h-4 w-4" />
            <span className="text-sm font-medium">
              This will permanently delete all projects and data.
            </span>
          </div>
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
            onClick={onSubmit}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
          >
            {isLoading ? "Deleting..." : "Delete Workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
