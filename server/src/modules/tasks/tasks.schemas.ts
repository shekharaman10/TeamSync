import { z } from "zod";

const TaskStatusEnum = z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);
const PriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

// Accepts both "YYYY-MM-DD" (from date inputs) and full ISO 8601 strings (from JS .toISOString())
const dueDateString = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "Must be a valid date");

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().max(5000).optional(),
  status: TaskStatusEnum.optional().default("TODO"),
  priority: PriorityEnum.optional().default("MEDIUM"),
  assigneeId: z.string().optional(),
  epicId: z.string().optional(),
  dueDate: dueDateString.optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: TaskStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  assigneeId: z.string().nullable().optional(),
  epicId: z.string().nullable().optional(),
  dueDate: dueDateString.nullable().optional(),
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

export const CreateCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(10000),
});

export const UpdateCommentSchema = z.object({
  body: z.string().min(1).max(10000),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;
