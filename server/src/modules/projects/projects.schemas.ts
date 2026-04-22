import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  key: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[A-Z0-9]+$/, "Key must be uppercase letters and numbers only"),
  description: z.string().max(500).optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
