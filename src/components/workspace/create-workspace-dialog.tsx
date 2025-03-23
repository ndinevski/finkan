import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

const EMOJI_OPTIONS = [
  "💼",
  "🏢",
  "🏗️",
  "📊",
  "📈",
  "💡",
  "🎯",
  "🚀",
  "⭐",
  "📌",
  "🔖",
  "📁",
  "📂",
  "🗂️",
  "📋",
  "📝",
  "✏️",
  "📌",
  "🎨",
  "🛠️",
];

interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    icon: string;
    description: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export function CreateWorkspaceDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: CreateWorkspaceDialogProps) {
  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      icon: selectedEmoji,
      description,
    });
    setName("");
    setSelectedEmoji(EMOJI_OPTIONS[0]);
    setDescription("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-surface-light dark:bg-surface-dark border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-text-light dark:text-text-dark">
            Create New Workspace
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-text-light dark:text-text-dark"
            >
              Workspace Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter workspace name"
              required
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-light dark:text-text-dark">
              Choose Icon
            </label>
            <div className="grid grid-cols-10 gap-2 p-1">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-full aspect-square flex items-center justify-center text-xl rounded transition-colors ${
                    selectedEmoji === emoji
                      ? "bg-primary/10 dark:bg-primary-light/10 ring-2 ring-primary dark:ring-primary-light"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium text-text-light dark:text-text-dark"
            >
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a short description"
              rows={3}
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
              {isLoading ? "Creating..." : "Create Workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
