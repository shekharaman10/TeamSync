import { z } from "zod";

export const InviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER"]),
});
export type InviteInput = z.infer<typeof InviteSchema>;
