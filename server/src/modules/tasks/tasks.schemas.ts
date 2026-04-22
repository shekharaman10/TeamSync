import { z } from "zod";

const TaskStatusEnum = z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);
const PriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().max(5000).optional(),
  status: TaskStatusEnum.optional().default("TODO"),
  priority: PriorityEnum.optional().default("MEDIUM"),
  assigneeId: z.string().optional(),
  epicId: z.string().optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: TaskStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  assigneeId: z.string().nullable().optional(),
  epicId: z.string().nullable().optional(),
  dueDate: z.string().datetime({ offset: true }).nullable().optional(),
});

export const TaskFiltersSchema = z.object({
  status: TaskStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  assigneeId: z.string().optional(),
  epicId: z.string().optional(),
  search: z.string().max(200).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(25),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskFiltersInput = z.infer<typeof TaskFiltersSchema>;
