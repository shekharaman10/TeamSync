import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { z } from "zod";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { HttpError } from "./utils/http-error";
import { authRouter } from "./modules/auth/auth.routes";

export const app = express();

app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Health check — confirms Express is up AND the DB connection works
app.get("/api/health", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "connected", time: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

app.use("/api/auth", authRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Not found" });
});

// Global error handler — must have 4 args so Express recognizes it as an error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof z.ZodError) {
    res.status(400).json({ message: "Validation error", errors: err.flatten().fieldErrors });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});
