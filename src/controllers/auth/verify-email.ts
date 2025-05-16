import { Context, Status } from "~/deps.ts";
import { z } from "~/deps.ts";
import { validateBody } from "@/utils/validation.util.ts";
import { sendSuccess } from "@/utils/response.util.ts";
import { generateJwtToken } from "@/utils/auth.util.ts";
import { UserRole } from "@/types/user.types.ts";
import { query } from "@/db/database.ts";
import { AppError } from "@/utils/error.util.ts";
import { config } from "@/config/config.ts";

// Schema for email verification
const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

/**
 * Verify email
 * Validates the email verification token and marks the user's email as verified
 */
export async function verifyEmail(ctx: Context): Promise<void> {
  try {
    const data = await validateBody(ctx, verifyEmailSchema);

    // Find user with the verification token
    const result = await query(
      `SELECT id, email 
       FROM users 
       WHERE verification_token = $1 
       AND verification_expires > NOW() 
       AND is_active = true 
       AND is_email_verified = false`,
      [data.token],
    );

    if (result.rows.length === 0) {
      throw new AppError(
        "Invalid or expired verification token",
        Status.BadRequest,
      );
    }

    const user = result.rows[0];

    // Update user to mark email as verified and clear verification token
    await query(
      `UPDATE users 
       SET is_email_verified = true, verification_token = NULL, verification_expires = NULL 
       WHERE id = $1`,
      [user.id],
    );

    // Generate JWT token
    const token = await generateJwtToken(user.id, user.email, UserRole.USER);

    sendSuccess(
      ctx,
      {
        token,
        expiresIn: config.JWT.EXPIRATION,
      },
      "Email verified successfully",
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to verify email", Status.InternalServerError);
  }
}
