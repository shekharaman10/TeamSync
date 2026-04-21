import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

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

// Feature routers will mount here later:
// app.use("/api/auth", authRouter);
// app.use("/api/workspaces", workspaceRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Not found" });
});

// Global error handler — must have 4 args so Express recognizes it
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});
