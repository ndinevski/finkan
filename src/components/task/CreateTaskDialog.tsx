import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Profile, TaskPriority, TaskStatus } from "@/lib/db/types";
import { useTaskStore } from "@/lib/store/task-store";
import { useAuthStore } from "@/lib/store/auth-store";

const dummyAssignees: Profile[] = [
  {
    id: "assignee-1",
    email: "member1@example.com",
    full_name: "Member One",
    avatar_url: null,
    role: "member",
    created_at: "",
    updated_at: "",
  },
  {
    id: "assignee-2",
    email: "member2@example.com",
    full_name: "Member Two",
    avatar_url: null,
    role: "member",
    created_at: "",
    updated_at: "",
  },
];

const priorityValues: [TaskPriority, ...TaskPriority[]] = [
  "low",
  "medium",
  "high",
  "urgent",
];
const statusValues: [TaskStatus, ...TaskStatus[]] = [
  "todo",
  "in_progress",
  "review",
  "done",
];

const taskBaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  priority: z.enum(priorityValues),
  status: z.enum(statusValues),
  due_date: z.date().nullable().optional(),
  is_recurring: z.boolean(),
  recurrence_pattern: z.string().optional(),
});

const taskSchema = taskBaseSchema.refine(
  (data) => {
    if (
      data.is_recurring &&
      (!data.recurrence_pattern || data.recurrence_pattern.trim() === "")
    ) {
      return false;
    }
    return true;
  },
  {
    message: "Recurrence pattern is required when task is recurring",
    path: ["recurrence_pattern"],
  }
);

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskDialogProps {
  columnId: string;
  projectId: string;
  trigger: React.ReactNode;
}

export function CreateTaskDialog({
  columnId,
  projectId,
  trigger,
}: CreateTaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { createTask } = useTaskStore();
  const { user } = useAuthStore();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      assignee_id: user?.id || null,
      priority: "medium",
      status: "todo",
      due_date: null,
      is_recurring: false,
      recurrence_pattern: "",
    },
  });

  useEffect(() => {
    form.reset({
      title: "",
      description: "",
      assignee_id: user?.id || null,
      priority: "medium",
      status: "todo",
      due_date: null,
      is_recurring: false,
      recurrence_pattern: "",
    });
  }, [user, form.reset]);
  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    console.log(
      "Submitting full task data via store:",
      JSON.stringify(data, null, 2)
    );
    try {
      const description = data.description?.trim() || undefined;
      const priority = data.priority || "medium";
      const dueDate = data.due_date ? data.due_date.toISOString() : undefined;
      const assignee_id = data.assignee_id || null;
      const is_recurring = Boolean(data.is_recurring);
      const recurrence_pattern = data.is_recurring
        ? data.recurrence_pattern || null
        : null;

      await createTask(
        columnId,
        data.title.trim(),
        description,
        priority,
        dueDate,
        assignee_id,
        is_recurring,
        recurrence_pattern
      );

      toast({ title: "Task created successfully!" });
      form.reset();
      setIsOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Failed to create task",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Task creation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px] bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-text-light dark:text-text-dark">
            Create New Task
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Fill in the details for the new task.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-task-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 py-4"
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="title"
              className="text-right text-text-light dark:text-text-dark"
            >
              Title
            </Label>
            <Input
              id="title"
              {...form.register("title")}
              className="col-span-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark"
              aria-invalid={form.formState.errors.title ? "true" : "false"}
            />
            {form.formState.errors.title && (
              <p
                className="col-span-4 text-red-500 text-sm text-right"
                role="alert"
              >
                {form.formState.errors.title.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="description"
              className="text-right text-text-light dark:text-text-dark"
            >
              Description
            </Label>
            <Textarea
              id="description"
              {...form.register("description")}
              className="col-span-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="assignee"
              className="text-right text-text-light dark:text-text-dark"
            >
              Assignee
            </Label>
            <Select
              onValueChange={(value) =>
                form.setValue(
                  "assignee_id",
                  value === "__NONE__" ? null : value
                )
              }
              value={form.watch("assignee_id") ?? "__NONE__"}
              disabled={!!user?.id}
            >
              <SelectTrigger className="col-span-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark disabled:opacity-70 disabled:cursor-not-allowed">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent className="bg-surface-light dark:bg-surface-dark border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark">
                {!user?.id && (
                  <SelectItem value="__NONE__">Unassigned</SelectItem>
                )}
                {user?.id && (
                  <SelectItem value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                )}
                {dummyAssignees
                  .filter((assignee) => assignee.id !== user?.id)
                  .map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id}>
                      {assignee.full_name || assignee.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="priority"
              className="text-right text-text-light dark:text-text-dark"
            >
              Priority
            </Label>
            <Select
              onValueChange={(value) =>
                form.setValue("priority", value as TaskPriority)
              }
              defaultValue={"medium"}
            >
              <SelectTrigger className="col-span-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent className="bg-surface-light dark:bg-surface-dark border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark">
                {priorityValues.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="due_date"
              className="text-right text-text-light dark:text-text-dark"
            >
              Due Date
            </Label>
            <Input
              id="due_date"
              type="date"
              className="col-span-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark"
              onChange={(e) =>
                form.setValue(
                  "due_date",
                  e.target.value ? new Date(e.target.value) : null
                )
              }
              value={
                form.watch("due_date")
                  ? form.watch("due_date")!.toISOString().split("T")[0]
                  : ""
              }
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label
              htmlFor="is_recurring"
              className="text-right pt-2 text-text-light dark:text-text-dark"
            >
              Recurring
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Checkbox
                id="is_recurring"
                checked={form.watch("is_recurring")}
                onCheckedChange={(checked) => {
                  const isChecked = Boolean(checked);
                  form.setValue("is_recurring", isChecked);
                  if (!isChecked) {
                    form.setValue("recurrence_pattern", "");
                    form.clearErrors("recurrence_pattern");
                  } else {
                    form.trigger("recurrence_pattern");
                  }
                }}
                className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <label
                htmlFor="is_recurring"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-text-light dark:text-text-dark"
              >
                Is this a recurring task?
              </label>
            </div>
          </div>
          {form.watch("is_recurring") && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="recurrence_pattern"
                className="text-right text-text-light dark:text-text-dark"
              >
                Pattern
              </Label>
              <Input
                id="recurrence_pattern"
                placeholder="e.g., Every Monday, Monthly on the 1st"
                {...form.register("recurrence_pattern")}
                className="col-span-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark"
                aria-invalid={
                  form.formState.errors.recurrence_pattern ? "true" : "false"
                }
              />
              {form.formState.errors.recurrence_pattern && (
                <p
                  className="col-span-4 text-red-500 text-sm text-right"
                  role="alert"
                >
                  {form.formState.errors.recurrence_pattern.message}
                </p>
              )}
            </div>
          )}
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-text-light dark:text-text-dark"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-task-form"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white"
          >
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
