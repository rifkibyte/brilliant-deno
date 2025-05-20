import { Context, Status } from "~/deps.ts";
import { z } from "~/deps.ts";
import { validateBody } from "@/utils/validation.util.ts";
import { sendCreated } from "@/utils/response.util.ts";
import { generateJwtToken, generateRandomToken, hashPassword } from "@/utils/auth.util.ts";
import { UserRole } from "@/types/user.types.ts";
import { query } from "@/db/database.ts";
import { AppError, ConflictError } from "@/utils/error.util.ts";
import { config } from "@/config/config.ts";
// import { sendEmail } from "@/utils/email.util.ts";

// Schema for user registration
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

/**
 * Register a new user
 * Creates a new user account and sends a verification email
 */
export async function register(ctx: Context): Promise<void> {
  try {
    const data: any = await validateBody(ctx, registerSchema);

    // Check if user already exists
    const existingUser = await query(
      "SELECT id FROM users WHERE email = $1",
      [data.email],
    );

    if (existingUser.rows.length > 0) {
      throw new ConflictError("User with this email already exists");
    }

    // Hash the password
    const hashedPassword = await hashPassword(data.password);

    // Generate a random verification token for email verification
    const verificationToken = generateRandomToken();

    // Set verification token expiration (24 hours from now)
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    // Insert the new user into the database
    const result = await query(
      `INSERT INTO users 
       (email, password, first_name, last_name, role, verification_token, verification_expires, is_active, is_email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id, email, first_name, last_name, role, created_at`,
      [
        data.email,
        hashedPassword,
        data.firstName,
        data.lastName,
        UserRole.USER,
        verificationToken,
        verificationExpires,
        true, // account is active
        false, // email not verified yet
      ],
    );

    const user = result.rows[0];

    // Send verification email
    // const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // await sendEmail({
    //   to: data.email,
    //   subject: "Verify your email address",
    //   html: `
    //     <h1>Email Verification</h1>
    //     <p>Hello ${data.firstName},</p>
    //     <p>Thank you for registering! Please verify your email address by clicking the link below:</p>
    //     <p><a href="${verificationUrl}">Verify Email</a></p>
    //     <p>This link will expire in 24 hours.</p>
    //     <p>If you did not create an account, please ignore this email.</p>
    //   `,
    // });

    // Generate JWT token for authentication
    const token = await generateJwtToken(user.id, user.email, user.role);

    // Include the verificationToken in the response for development/testing purposes only.
    // WARNING: Do NOT include this in production for security reasons.
    sendCreated(ctx, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at,
        isEmailVerified: false,
      },
      token,
      expiresIn: config.JWT.EXPIRATION,
      verificationToken, // <-- For development/testing only!
      message:
        "Please check your email to verify your account. You cannot fully use your account until you verify your email.",
    }, "User registered successfully. Please verify your email.");
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to register user", Status.InternalServerError);
  }
}
