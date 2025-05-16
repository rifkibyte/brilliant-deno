import { Context, Status } from "~/deps.ts";
import { sendSuccess } from "@/utils/response.util.ts";
import { generateJwtToken } from "@/utils/auth.util.ts";
import { AppError } from "@/utils/error.util.ts";
import { config } from "@/config/config.ts";

/**
 * Refresh token
 * Generates a new JWT token for an authenticated user
 */
export async function refreshToken(ctx: Context): Promise<void> {
  try {
    // Get user from context (set by authMiddleware)
    const user = ctx.state.user;

    // Generate new token
    const token = await generateJwtToken(user.id, user.email, user.role);

    sendSuccess(ctx, {
      token,
      expiresIn: config.JWT.EXPIRATION,
    }, "Token refreshed");
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to refresh token", Status.InternalServerError);
  }
}
