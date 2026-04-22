import { z } from "zod";

const TASK_STATUSES = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(TASK_STATUSES).default("TODO"),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  assigneeId: z.string().optional(),
  epicId: z.string().optional(),
  dueDate: z.string().optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = CreateTaskSchema.partial();
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
