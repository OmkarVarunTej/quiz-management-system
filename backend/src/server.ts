import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Quiz Management System API running on port ${env.PORT} [${env.NODE_ENV}]`);
  console.log(`   API base: http://localhost:${env.PORT}${env.API_PREFIX}`);
});

const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Server closed. Database disconnected.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
