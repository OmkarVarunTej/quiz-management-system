import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env";
import routes from "./routes";
import { globalRateLimiter } from "./middlewares/rateLimiter.middleware";
import { notFoundHandler } from "./middlewares/notFound.middleware";
import { globalErrorHandler } from "./middlewares/error.middleware";

export const createApp = (): Application => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(globalRateLimiter);

  app.use(env.API_PREFIX, routes);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
