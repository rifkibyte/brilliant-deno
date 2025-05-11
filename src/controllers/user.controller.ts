import { Context, Status, log } from "../../deps.ts";
import { query } from "../db/database.ts";
import { User, UserRole, UserUpdatePayload } from "../types/user.types.ts";
import { 
  sendSuccess, 
  sendBadRequest, 
  sendNotFound, 
  sendForbidden
} from "../utils/response.util.ts";
import { validateBody } from "../utils/validation.util.ts";
import { z } from "../../deps.ts";
import { hashPassword, verifyPassword } from "../utils/auth.util.ts";

const logger = log.getLogger();

/**
 * Get the current authenticated user's profile
 */
export async function getCurrentUser(ctx: Context) {
  const userId = ctx.state.user.sub;
  
  try {
    const result = await query(
      "SELECT id, email, first_name, last_name, role, profile_picture, created_at, updated_at, last_login, is_active, is_email_verified FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return sendNotFound(ctx, "User not found");
    }

    const user = mapUserFromDb(result.rows[0]);
    return sendSuccess(ctx, user);
  } catch (error) {
    logger.error(`Error fetching current user: ${error.message}`);
    throw error;
  }
}

/**
 * Update the current authenticated user's profile
 */
export async function updateProfile(ctx: Context) {
  const userId = ctx.state.user.sub;
  
  // Validate request body
  const updateSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    profilePicture: z.string().url().optional(),
  });
  
  const validatedData = await validateBody<UserUpdatePayload>(ctx, updateSchema);
  if (!validatedData) return;
  
  try {
    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (validatedData.firstName !== undefined) {
      updates.push(`first_name = $${paramIndex}`);
      values.push(validatedData.firstName);
      paramIndex++;
    }
    
    if (validatedData.lastName !== undefined) {
      updates.push(`last_name = $${paramIndex}`);
      values.push(validatedData.lastName);
      paramIndex++;
    }
    
    if (validatedData.profilePicture !== undefined) {
      updates.push(`profile_picture = $${paramIndex}`);
      values.push(validatedData.profilePicture);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return sendBadRequest(ctx, "No update data provided");
    }
    
    updates.push(`updated_at = NOW()`);
    
    // Add user ID as the last parameter
    values.push(userId);
    
    const result = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING id, email, first_name, last_name, role, profile_picture, created_at, updated_at, is_active, is_email_verified`,
      values
    );
    
    if (result.rows.length === 0) {
      return sendNotFound(ctx, "User not found");
    }
    
    const updatedUser = mapUserFromDb(result.rows[0]);
    return sendSuccess(ctx, updatedUser, "Profile updated successfully");
  } catch (error) {
    logger.error(`Error updating user profile: ${error.message}`);
    throw error;
  }
}

/**
 * Update the current authenticated user's password
 */
export async function updatePassword(ctx: Context) {
  const userId = ctx.state.user.sub;
  
  // Validate request body
  const passwordSchema = z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8)
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });
  
  const validatedData = await validateBody(ctx, passwordSchema);
  if (!validatedData) return;
  
  try {
    // Verify current password
    const userResult = await query(
      "SELECT password FROM users WHERE id = $1",
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return sendNotFound(ctx, "User not found");
    }
    
    const user = userResult.rows[0];
    const isPasswordValid = await verifyPassword(validatedData.currentPassword, user.password);
    
    if (!isPasswordValid) {
      return sendBadRequest(ctx, "Current password is incorrect", {
        currentPassword: ["Current password is incorrect"]
      });
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(validatedData.newPassword);
    
    // Update password
    await query(
      "UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2",
      [hashedPassword, userId]
    );
    
    return sendSuccess(ctx, null, "Password updated successfully");
  } catch (error) {
    logger.error(`Error updating password: ${error.message}`);
    throw error;
  }
}

/**
 * Upload a profile picture for the current authenticated user
 */
export async function uploadProfilePicture(ctx: Context) {
  const userId = ctx.state.user.sub;
  
  // Check if request has the required form data
  const body = await ctx.request.body();
  if (!body.type || body.type !== "form-data") {
    return sendBadRequest(ctx, "Form data is required");
  }
  
  const formData = await body.value.read({ maxFileSize: 10 * 1024 * 1024 }); // 10MB limit
  const profilePicture = formData.files?.[0];
  
  if (!profilePicture) {
    return sendBadRequest(ctx, "Profile picture is required");
  }
  
  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(profilePicture.contentType)) {
    return sendBadRequest(ctx, "Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP");
  }
  
  try {
    // In a real application, you would upload this to a storage service
    // For this example, we'll assume the file is saved and we store the URL
    const fileUrl = `https://example.com/uploads/${userId}/${profilePicture.filename}`;
    
    // Update user profile with new picture URL
    const result = await query(
      "UPDATE users SET profile_picture = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, first_name, last_name, role, profile_picture",
      [fileUrl, userId]
    );
    
    if (result.rows.length === 0) {
      return sendNotFound(ctx, "User not found");
    }
    
    return sendSuccess(ctx, { profilePicture: fileUrl }, "Profile picture updated successfully");
  } catch (error) {
    logger.error(`Error uploading profile picture: ${error.message}`);
    throw error;
  }
}

/**
 * Get a user by ID (admin only)
 */
export async function getUserById(ctx: Context) {
  const userId = ctx.params.id;
  
  try {
    const result = await query(
      "SELECT id, email, first_name, last_name, role, profile_picture, created_at, updated_at, last_login, is_active, is_email_verified FROM users WHERE id = $1",
      [userId]
    );
    
    if (result.rows.length === 0) {
      return sendNotFound(ctx, "User not found");
    }
    
    const user = mapUserFromDb(result.rows[0]);
    return sendSuccess(ctx, user);
  } catch (error) {
    logger.error(`Error fetching user by ID: ${error.message}`);
    throw error;
  }
}

/**
 * List all users (admin only)
 */
export async function listUsers(ctx: Context) {
  try {
    const page = parseInt(ctx.request.url.searchParams.get("page") || "1");
    const limit = parseInt(ctx.request.url.searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    
    // Get total count for pagination
    const countResult = await query("SELECT COUNT(*) FROM users");
    const totalUsers = parseInt(countResult.rows[0].count);
    
    // Get users with pagination
    const result = await query(
      "SELECT id, email, first_name, last_name, role, profile_picture, created_at, updated_at, last_login, is_active, is_email_verified FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    
    const users = result.rows.map(mapUserFromDb);
    
    return sendSuccess(ctx, users, "Users retrieved successfully", Status.OK, {
      pagination: {
        page,
        limit,
        totalItems: totalUsers,
        totalPages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    logger.error(`Error listing users: ${error.message}`);
    throw error;
  }
}

/**
 * Toggle a user's active status (admin only)
 */
export async function toggleUserStatus(ctx: Context) {
  const userId = ctx.params.id;
  
  // Validate request body
  const statusSchema = z.object({
    isActive: z.boolean()
  });
  
  const validatedData = await validateBody(ctx, statusSchema);
  if (!validatedData) return;
  
  try {
    // Check if trying to deactivate an admin account
    const userResult = await query(
      "SELECT role FROM users WHERE id = $1",
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return sendNotFound(ctx, "User not found");
    }
    
    const user = userResult.rows[0];
    
    // Prevent deactivating admin accounts (except by themselves)
    if (user.role === UserRole.ADMIN && !validatedData.isActive && ctx.state.user.sub !== userId) {
      return sendForbidden(ctx, "Cannot deactivate another admin account");
    }
    
    // Update user status
    const result = await query(
      "UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, first_name, last_name, role, is_active",
      [validatedData.isActive, userId]
    );
    
    if (result.rows.length === 0) {
      return sendNotFound(ctx, "User not found");
    }
    
    const updatedUser = mapUserFromDb(result.rows[0]);
    const statusMessage = validatedData.isActive ? "activated" : "deactivated";
    
    return sendSuccess(ctx, updatedUser, `User ${statusMessage} successfully`);
  } catch (error) {
    logger.error(`Error toggling user status: ${error.message}`);
    throw error;
  }
}

/**
 * Update a user's role (admin only)
 */
export async function updateUserRole(ctx: Context) {
  const userId = ctx.params.id;
  
  // Validate request body
  const roleSchema = z.object({
    role: z.enum([UserRole.USER, UserRole.TEACHER, UserRole.ADMIN])
  });
  
  const validatedData = await validateBody(ctx, roleSchema);
  if (!validatedData) return;
  
  try {
    // Check if user exists
    const userResult = await query(
      "SELECT id FROM users WHERE id = $1",
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return sendNotFound(ctx, "User not found");
    }
    
    // Update user role
    const result = await query(
      "UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, first_name, last_name, role, is_active",
      [validatedData.role, userId]
    );
    
    const updatedUser = mapUserFromDb(result.rows[0]);
    return sendSuccess(ctx, updatedUser, "User role updated successfully");
  } catch (error) {
    logger.error(`Error updating user role: ${error.message}`);
    throw error;
  }
}

/**
 * Helper function to map database user object to User type
 */
function mapUserFromDb(dbUser: any): Partial<User> {
  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    role: dbUser.role,
    profilePicture: dbUser.profile_picture,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
    lastLogin: dbUser.last_login,
    isActive: dbUser.is_active,
    isEmailVerified: dbUser.is_email_verified
  };
}