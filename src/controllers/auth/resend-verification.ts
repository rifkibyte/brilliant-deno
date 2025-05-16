import { Context, Status } from "~/deps.ts";
import { z } from "~/deps.ts";
import { validateBody } from "@/utils/validation.util.ts";
import { sendSuccess } from "@/utils/response.util.ts";
import { generateRandomToken } from "@/utils/auth.util.ts";
import { query } from "@/db/database.ts";
import { AppError } from "@/utils/error.util.ts";
import { config } from "@/config/config.ts";
import { sendEmail } from "@/utils/email.util.ts";

// Schema for email verification resend
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * Resend verification email
 * Generates a new verification token and sends a new verification email to the user
 */
export async function resendVerificationEmail(ctx: Context): Promise<void> {
  try {
    const { email } = await validateBody(ctx, forgotPasswordSchema);

    // Find the user
    const result = await query(
      `SELECT id, email, first_name, is_email_verified 
       FROM users 
       WHERE email = $1 AND is_active = true`,
      [email],
    );

    if (result.rows.length === 0 || result.rows[0].is_email_verified) {
      // Don't reveal if the email exists or is already verified for security reasons
      sendSuccess(
        ctx,
        null,
        "If your email is registered and not verified, you will receive a verification link",
      );
      return;
    }

    const user = result.rows[0];

    // Generate new verification token
    const verificationToken = generateRandomToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    // Update user with new verification token
    await query(
      `UPDATE users 
       SET verification_token = $1, verification_expires = $2 
       WHERE id = $3`,
      [verificationToken, verificationExpires, user.id],
    );

    // Send verification email
    const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Verify your email address",
      html: `
        <h1>Email Verification</h1>
        <p>Hello ${user.first_name},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationUrl}">Verify Email</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, please ignore this email.</p>
      `,
    });

    sendSuccess(
      ctx,
      null,
      "If your email is registered and not verified, you will receive a verification link",
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to resend verification email", Status.InternalServerError);
  }
}
