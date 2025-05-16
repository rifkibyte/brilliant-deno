import { Context, Status } from "~/deps.ts";
import { sendSuccess } from "@/utils/response.util.ts";
import { blacklistToken } from "@/utils/auth.util.ts";
import { AppError } from "@/utils/error.util.ts";

/**
 * Logout user
 * Invalidates the user's JWT token by adding it to a blacklist
 */
export async function logout(ctx: Context): Promise<void> {
  try {
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Invalid token", Status.BadRequest);
    }

    const token = authHeader.split(" ")[1];

    // Blacklist the token
    await blacklistToken(token);

    sendSuccess(ctx, null, "Logout successful");
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to logout", Status.InternalServerError);
  }
}
