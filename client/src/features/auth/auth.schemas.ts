import { z } from "zod";

// TODO: extract to packages/shared-schemas when monorepo tooling is added.
// Keep these in sync with server/src/modules/auth/auth.schemas.ts manually until then.

export const SignupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  // bcrypt silently truncates at 72 bytes — enforce the boundary client-side too
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});
export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  // No min(8) — don't hint at password requirements on login
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof LoginSchema>;
