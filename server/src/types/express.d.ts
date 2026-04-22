import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      membership?: {
        userId: string;
        workspaceId: string;
        role: Role;
      };
    }
  }
}
