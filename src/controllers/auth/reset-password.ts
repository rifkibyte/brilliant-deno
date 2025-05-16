import { Context, Status } from "~/deps.ts";
import { z } from "~/deps.ts";
import { validateBody } from "@/utils/validation.util.ts";
import { sendSuccess } from "@/utils/response.util.ts";
import { hashPassword } from "@/utils/auth.util.ts";
import { query } from "@/db/database.ts";
import { AppError } from "@/utils/error.util.ts";

// Schema for password reset
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Reset password
 * Validates the reset token and updates the user's password
 */
export async function resetPassword(ctx: Context): Promise<void> {
  try {
    const data = await validateBody(ctx, resetPasswordSchema);

    // Find user with the reset token
    const result = await query(
      `SELECT id, email 
       FROM users 
       WHERE password_reset_token = $1 
       AND password_reset_expires > NOW() 
       AND is_active = true`,
      [data.token],
    );

    if (result.rows.length === 0) {
      throw new AppError("Invalid or expired reset token", Status.BadRequest);
    }

    const user = result.rows[0];

    // Hash the new password
    const hashedPassword = await hashPassword(data.password);

    // Update user password and clear reset token
    await query(
      `UPDATE users 
       SET password = $1, password_reset_token = NULL, password_reset_expires = NULL 
       WHERE id = $2`,
      [hashedPassword, user.id],
    );

    sendSuccess(ctx, null, "Password has been reset successfully");
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to reset password", Status.InternalServerError);
  }
}
