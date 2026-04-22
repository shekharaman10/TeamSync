import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  key: z
    .string()
    .min(1, "Key is required")
    .max(5)
    .regex(/^[A-Z0-9]+$/, "Key must be uppercase letters and numbers only"),
  description: z.string().max(500).optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = CreateProjectSchema;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

export function generateProjectKey(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5) || name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
}
