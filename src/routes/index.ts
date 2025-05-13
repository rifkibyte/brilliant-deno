import { Router } from "../../deps.ts";
import { authRoutes } from "./auth.routes.ts";
import { userRoutes } from "./user.routes.ts";
// import { courseRoutes } from "./course.routes.ts";
// import { progressRoutes } from "./progress.routes.ts";
// import { leaderboardRoutes } from "./leaderboard.routes.ts";
// import { notificationRoutes } from "./notification.routes.ts";
// import { analyticsRoutes } from "./analytics.routes.ts";

export function setupRoutes(router: Router): void {
  // API version prefix
  const apiPrefix = "/api/v1";
  
  // Set up all routes
  router.use(`${apiPrefix}/auth`, authRoutes.routes(), authRoutes.allowedMethods());
  router.use(`${apiPrefix}/users`, userRoutes.routes(), userRoutes.allowedMethods());
  // router.use(`${apiPrefix}/courses`, courseRoutes.routes(), courseRoutes.allowedMethods());
  // router.use(`${apiPrefix}/progress`, progressRoutes.routes(), progressRoutes.allowedMethods());
  // router.use(`${apiPrefix}/leaderboard`, leaderboardRoutes.routes(), leaderboardRoutes.allowedMethods());
  // router.use(`${apiPrefix}/notifications`, notificationRoutes.routes(), notificationRoutes.allowedMethods());
  // router.use(`${apiPrefix}/analytics`, analyticsRoutes.routes(), analyticsRoutes.allowedMethods());
  
  // Health check route
  router.get(`${apiPrefix}/health`, (ctx) => {
    ctx.response.body = {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };
  });
}