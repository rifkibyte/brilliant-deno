import { Context, Status } from "~/deps.ts";
import { z } from "~/deps.ts";
import { validateBody } from "@/utils/validation.util.ts";
import { sendSuccess } from "@/utils/response.util.ts";
import { generateJwtToken, verifyPassword } from "@/utils/auth.util.ts";
import { query } from "@/db/database.ts";
import { AppError } from "@/utils/error.util.ts";
import { config } from "@/config/config.ts";

// Schema for user login
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Login user
 * Authenticates user credentials and returns a JWT token
 */
export async function login(ctx: Context): Promise<void> {
  try {
    const data = await validateBody(ctx, loginSchema);

    // Find the user
    const result = await query(
      `SELECT id, email, password, first_name, last_name, role, is_active, is_email_verified 
       FROM users 
       WHERE email = $1`,
      [data.email],
    );

    if (result.rows.length === 0) {
      throw new AppError("Invalid email or password", Status.Unauthorized);
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      throw new AppError("Account is disabled", Status.Forbidden);
    }

    // Check if email is verified
    if (!user.is_email_verified) {
      throw new AppError(
        "Email not verified. Please check your email for verification link.",
        Status.Forbidden,
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", Status.Unauthorized);
    }

    // Update last login time
    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    // Generate JWT token
    const token = await generateJwtToken(user.id, user.email, user.role);

    sendSuccess(
      ctx,
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isEmailVerified: user.is_email_verified,
        },
        token,
        expiresIn: config.JWT.EXPIRATION,
      },
      "Login successful",
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to login", Status.InternalServerError);
  }
}
