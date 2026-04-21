import { z } from "zod";

export const SignupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  // bcrypt silently truncates at 72 bytes — enforce that boundary here
  password: z.string().min(8).max(72),
});
export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  // Intentionally no min(8) — don't hint at password requirements on login
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;
