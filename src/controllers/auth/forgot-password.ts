import { Context, Status } from "~/deps.ts";
import { z } from "~/deps.ts";
import { validateBody } from "@/utils/validation.util.ts";
import { sendSuccess } from "@/utils/response.util.ts";
import { generateRandomToken } from "@/utils/auth.util.ts";
import { query } from "@/db/database.ts";
import { AppError } from "@/utils/error.util.ts";
import { config } from "@/config/config.ts";
import { sendEmail } from "@/utils/email.util.ts";

// Schema for password reset request
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * Request password reset
 * Generates a password reset token and sends a reset link to the user's email
 */
export async function forgotPassword(ctx: Context): Promise<void> {
  try {
    const data = await validateBody(ctx, forgotPasswordSchema);

    // Find the user
    const result = await query(
      "SELECT id, email, first_name FROM users WHERE email = $1 AND is_active = true",
      [data.email],
    );

    if (result.rows.length === 0) {
      // Don't reveal if the email exists or not for security reasons
      sendSuccess(ctx, null, "If your email is registered, you will receive a password reset link");
      return;
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = generateRandomToken();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // Token valid for 1 hour

    // Update user with reset token
    await query(
      "UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3",
      [resetToken, resetExpires, user.id],
    );

    // Send password reset email
    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: data.email,
      subject: "Reset your password",
      html: `
        <h1>Password Reset</h1>
        <p>Hello ${user.first_name},</p>
        <p>You requested to reset your password. Please click the link below to set a new password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      `,
    });

    sendSuccess(ctx, null, "If your email is registered, you will receive a password reset link");
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to process password reset request", Status.InternalServerError);
  }
}
