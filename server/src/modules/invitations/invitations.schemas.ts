import { z } from "zod";

export const InviteSchema = z.object({
  email: z.string().email("Valid email required"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const AcceptInviteSchema = z.object({
  token: z.string().min(1),
});

export type InviteInput = z.infer<typeof InviteSchema>;
export type AcceptInviteInput = z.infer<typeof AcceptInviteSchema>;
