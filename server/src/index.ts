import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const server = app.listen(Number(env.PORT), () => {
  console.log(`🚀 API running on http://localhost:${env.PORT}`);
  console.log(`   Env: ${env.NODE_ENV}`);
});

const shutdown = async (signal: string) => {
  console.log(`\n${signal} received — shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));