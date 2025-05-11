import { Application, Router, oakCors, log } from "../deps.ts";
import { errorMiddleware } from "./middleware/error.middleware.ts";
import { setupRoutes } from "./routes/index.ts";
import { config } from "./config/config.ts";
import { initDb } from "./db/database.ts";
import { initRedis } from "./db/redis.ts";

// Initialize the application
const app = new Application();
const router = new Router();

// Initialize database connections
await initDb();
await initRedis();

// Set up global middleware
app.use(errorMiddleware);
app.use(oakCors({
  origin: config.CORS_ORIGIN,
  optionsSuccessStatus: 200,
}));

// Logger middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  const logger = log.getLogger();
  logger.info(`${ctx.request.method} ${ctx.request.url.pathname} - ${ms}ms`);
});

// Set up routes
setupRoutes(router);
app.use(router.routes());
app.use(router.allowedMethods());

// 404 handler
app.use((ctx) => {
  ctx.response.status = 404;
  ctx.response.body = {
    success: false,
    message: "Not Found",
    data: null,
  };
});

export { app };