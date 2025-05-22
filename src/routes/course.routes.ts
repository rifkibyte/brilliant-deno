import { Router } from "../../deps.ts";
import { authMiddleware, roleMiddleware } from "@/middleware/auth.middleware.ts";
import {
  createCourse,
  createLesson,
  createModule,
  deleteCourse,
  deleteLesson,
  deleteModule,
  enrollCourse,
  getCourseById,
  getLessonById,
  getLessonProgress,
  getModuleById,
  getUserEnrollments,
  listCourses,
  listCoursesByCategory,
  listLessons,
  listModules,
  publishCourse,
  unenrollCourse,
  unpublishCourse,
  updateCourse,
  updateLesson,
  updateLessonProgress,
  updateModule,
} from "../controllers/module/module.controller.ts";

// Create router
const courseRoutes = new Router();

// Public routes
courseRoutes.get("/", listCourses);
courseRoutes.get("/category/:category", listCoursesByCategory);
courseRoutes.get("/:id", getCourseById);

// Protected routes - require authentication
courseRoutes.use(authMiddleware);

// User routes - for enrolled users
courseRoutes.get("/enrollments", getUserEnrollments);
courseRoutes.post("/enroll/:courseId", enrollCourse);
courseRoutes.delete("/enroll/:courseId", unenrollCourse);

// Lesson progress routes
courseRoutes.get("/lessons/:lessonId/progress", getLessonProgress);
courseRoutes.post("/lessons/:lessonId/progress", updateLessonProgress);

// Course modules routes
courseRoutes.get("/:courseId/modules", listModules);
courseRoutes.get("/modules/:moduleId", getModuleById);

// Course lessons routes
courseRoutes.get("/modules/:moduleId/lessons", listLessons);
courseRoutes.get("/lessons/:lessonId", getLessonById);

// Admin and instructor routes - require specific roles
const adminInstructorMiddleware = roleMiddleware(["ADMIN", "INSTRUCTOR"]);
courseRoutes.use(adminInstructorMiddleware);

// Course management routes
courseRoutes.post("/", createCourse);
courseRoutes.put("/:id", updateCourse);
courseRoutes.delete("/:id", deleteCourse);
courseRoutes.post("/:id/publish", publishCourse);
courseRoutes.post("/:id/unpublish", unpublishCourse);

// Module management routes
courseRoutes.post("/:courseId/modules", createModule);
courseRoutes.put("/modules/:moduleId", updateModule);
courseRoutes.delete("/modules/:moduleId", deleteModule);

// Lesson management routes
courseRoutes.post("/modules/:moduleId/lessons", createLesson);
courseRoutes.put("/lessons/:lessonId", updateLesson);
courseRoutes.delete("/lessons/:lessonId", deleteLesson);

export { courseRoutes };
