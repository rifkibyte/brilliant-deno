import { Context, Status, z } from "../../deps.ts";
import { validateBody } from "../utils/validation.util.ts";
import { sendSuccess, sendError, sendCreated } from "../utils/response.util.ts";
import { generateJwtToken, hashPassword, verifyPassword, generateRandomToken, blacklistToken } from "../utils/auth.util.ts";
import { UserRole } from "../types/user.types.ts";
import { query } from "../db/database.ts";
import { setCache, getCache, deleteCache } from "../db/redis.ts";
import { AppError, NotFoundError, ConflictError } from "../utils/error.util.ts";
import { config } from "../config/config.ts";

// Schema for user registration
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

// Schema for user login
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Schema for password reset request
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Schema for password reset
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Register a new user
export async function register(ctx: Context): Promise<void> {
  try {
    const data = await validateBody(ctx, registerSchema);
    
    // Check if user already exists
    const existingUser = await query(
      "SELECT id FROM users WHERE email = $1",
      [data.email]
    );
    
    if (existingUser.rows.length > 0) {
      throw new ConflictError("User with this email already exists");
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(data.password);
    
    // Generate verification token
    const verificationToken = generateRandomToken();
    
    // Insert the new user
    const result = await query(
      `INSERT INTO users 
       (email, password, first_name, last_name, role, verification_token, is_active, is_email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, email, first_name, last_name, role, created_at`,
      [
        data.email,
        hashedPassword,
        data.firstName,
        data.lastName,
        UserRole.USER,
        verificationToken,
        true,
        false,
      ]
    );
    
    const user = result.rows[0];
    
    // TODO: Send verification email
    
    // Generate JWT token
    const token = await generateJwtToken(user.id, user.email, user.role);
    
    sendCreated(ctx, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at,
      },
      token,
      expiresIn: config.JWT.EXPIRATION,
    }, "User registered successfully");
    
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to register user", Status.InternalServerError);
  }
}

// Login user
export async function login(ctx: Context): Promise<void> {
  try {
    const data = await validateBody(ctx, loginSchema);
    
    // Find the user
    const result = await query(
      `SELECT id, email, password, first_name, last_name, role, is_active, is_email_verified 
       FROM users 
       WHERE email = $1`,
      [data.email]
    );
    
    if (result.rows.length === 0) {
      throw new AppError("Invalid email or password", Status.Unauthorized);
    }
    
    const user = result.rows[0];
    
    // Check if user is active
    if (!user.is_active) {
      throw new AppError("Account is disabled", Status.Forbidden);
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", Status.Unauthorized);
    }
    
    // Update last login time
    await query(
      "UPDATE users SET last_login = NOW() WHERE id = $1",
      [user.id]
    );
    
    // Generate JWT token
    const token = await generateJwtToken(user.id, user.email, user.role);
    
    sendSuccess(ctx, {
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
    }, "Login successful");
    
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to login", Status.InternalServerError);
  }
}

// Logout user
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

// Refresh token
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

// Request password reset
export async function forgotPassword(ctx: Context): Promise<void> {
  try {
    const data = await validateBody(ctx, forgotPasswordSchema);
    
    // Find the user
    const result = await query(
      "SELECT id, email FROM users WHERE email = $1 AND is_active = true",
      [data.email]
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
      [resetToken, resetExpires, user.id]
    );
    
    // TODO: Send password reset email
    
    sendSuccess(ctx, null, "If your email is registered, you will receive a password reset link");
    
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to process password reset request", Status.InternalServerError);
  }
}

// Reset password
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
      [data.token]
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
      [hashedPassword, user.id]
    );
    
    sendSuccess(ctx, null, "Password has been reset successfully");
    
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to reset password", Status.InternalServerError);
  }
}

// Google OAuth login
export async function googleAuth(ctx: Context): Promise<void> {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.GOOGLE_OAUTH.CLIENT_ID}&redirect_uri=${encodeURIComponent(config.GOOGLE_OAUTH.REDIRECT_URI)}&response_type=code&scope=email%20profile`;
  ctx.response.redirect(googleAuthUrl);
}

// Google OAuth callback
export async function googleCallback(ctx: Context): Promise<void> {
  try {
    const code = ctx.request.url.searchParams.get("code");
    
    if (!code) {
      throw new AppError("Authorization code not provided", Status.BadRequest);
    }
    
    // Exchange code for token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: config.GOOGLE_OAUTH.CLIENT_ID,
        client_secret: config.GOOGLE_OAUTH.CLIENT_SECRET,
        redirect_uri: config.GOOGLE_OAUTH.REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new AppError("Failed to get access token", Status.InternalServerError);
    }
    
    // Get user info
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    const userInfo = await userInfoResponse.json();
    
    // Check if user exists
    const existingUserResult = await query(
      "SELECT id, email, first_name, last_name, role FROM users WHERE google_id = $1 OR email = $2",
      [userInfo.id, userInfo.email]
    );
    
    let user;
    
    if (existingUserResult.rows.length === 0) {
      // Create new user
      const names = userInfo.name.split(" ");
      const firstName = names[0] || "";
      const lastName = names.slice(1).join(" ") || "";
      
      const newUserResult = await query(
        `INSERT INTO users 
         (email, google_id, first_name, last_name, role, is_active, is_email_verified) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id, email, first_name, last_name, role`,
        [
          userInfo.email,
          userInfo.id,
          firstName,
          lastName,
          UserRole.USER,
          true,
          true,
        ]
      );
      
      user = newUserResult.rows[0];
    } else {
      user = existingUserResult.rows[0];
      
      // Update Google ID if not set
      if (!user.google_id) {
        await query(
          "UPDATE users SET google_id = $1, is_email_verified = true WHERE id = $2",
          [userInfo.id, user.id]
        );
      }
    }
    
    // Generate JWT token
    const token = await generateJwtToken(user.id, user.email, user.role);
    
    // Redirect to frontend with token
    const frontendUrl = new URL(config.FRONTEND_URL || "http://localhost:3000");
    frontendUrl.searchParams.set("token", token);
    
    ctx.response.redirect(frontendUrl.toString());
    
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to authenticate with Google", Status.InternalServerError);
  }
}