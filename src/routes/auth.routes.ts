import { Router } from "../../deps.ts";
import { register, login, logout, refreshToken, forgotPassword, resetPassword, googleAuth, googleCallback } from "../controllers/auth.controller.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import { rateLimitMiddleware } from "../middleware/rate-limit.middleware.ts";

const router = new Router();

// Rate limiting for authentication routes
const authRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: "Too many authentication attempts, please try again later."
});

// Public routes
router.post("/register", authRateLimit, register);
router.post("/login", authRateLimit, login);
router.post("/forgot-password", authRateLimit, forgotPassword);
router.post("/reset-password", authRateLimit, resetPassword);
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

// Protected routes (require authentication)
router.use(authMiddleware);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);

export const authRoutes = router;