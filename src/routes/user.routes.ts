import { Router } from "../../deps.ts";
import { 
  getCurrentUser, 
  updateProfile, 
  updatePassword, 
  uploadProfilePicture,
  getUserById,
  listUsers,
  toggleUserStatus,
  updateUserRole
} from "../controllers/user.controller.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import { roleMiddleware } from "../middleware/auth.middleware.ts";
import { UserRole } from "../types/user.types.ts";

const router = new Router();

// All user routes require authentication
router.use(authMiddleware);

// Routes for all authenticated users
router.get("/me", getCurrentUser);
router.put("/me", updateProfile);
router.put("/me/password", updatePassword);
router.post("/me/profile-picture", uploadProfilePicture);

// Admin-only routes
router.get("/", roleMiddleware([UserRole.ADMIN]), listUsers);
router.get("/:id", roleMiddleware([UserRole.ADMIN]), getUserById);
router.patch("/:id/status", roleMiddleware([UserRole.ADMIN]), toggleUserStatus);
router.patch("/:id/role", roleMiddleware([UserRole.ADMIN]), updateUserRole);

export const userRoutes = router;