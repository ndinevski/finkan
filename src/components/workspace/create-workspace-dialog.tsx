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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Workspace Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter workspace name"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Choose Icon</label>
            <div className="grid grid-cols-10 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`p-2 text-xl rounded hover:bg-gray-100 ${
                    selectedEmoji === emoji
                      ? "bg-gray-100 ring-2 ring-blue-500"
                      : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a short description"
              rows={3}
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
              {isLoading ? "Creating..." : "Create Workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
