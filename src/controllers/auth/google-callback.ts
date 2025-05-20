import { Context, Status } from "~/deps.ts";
import { AppError } from "@/utils/error.util.ts";
import { config } from "@/config/config.ts";
import { query } from "@/db/database.ts";
import { generateJwtToken, generateRandomToken, hashPassword } from "@/utils/auth.util.ts";
import { UserRole } from "@/types/user.types.ts";
import { sendSuccess } from "@/utils/response.util.ts";

/**
 * Google OAuth callback
 * Handles the callback from Google OAuth authentication
 */
export async function googleCallback(ctx: Context): Promise<void> {
  try {
    // Get the authorization code from the query parameters
    const code = ctx.request.url.searchParams.get("code");

    if (!code) {
      throw new AppError("Authorization code not provided", Status.BadRequest);
    }

    // Exchange the authorization code for tokens
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

    if (!tokenResponse.ok) {
      throw new AppError(
        "Failed to exchange authorization code for tokens",
        Status.InternalServerError,
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user information from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new AppError(
        "Failed to fetch user information from Google",
        Status.InternalServerError,
      );
    }

    const userData = await userInfoResponse.json();

    // Check if user already exists in our database
    const existingUser = await query(
      "SELECT id, email, first_name, last_name, role, is_email_verified FROM users WHERE email = $1",
      [userData.email],
    );

    let user;
    let isNewUser = false;

    if (existingUser.rows.length > 0) {
      // User exists, update their last login
      user = existingUser.rows[0];

      await query(
        "UPDATE users SET last_login = NOW() WHERE id = $1",
        [user.id],
      );
    } else {
      // Create new user with Google data
      isNewUser = true;

      // Generate a random password for the user (they will use Google to sign in)
      const randomPassword = generateRandomToken(16);
      const hashedPassword = await hashPassword(randomPassword);

      // Split the name into first and last name
      const nameParts = userData.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      // Insert the new user into the database
      const result = await query(
        `INSERT INTO users 
         (email, password, first_name, last_name, role, is_active, is_email_verified, google_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id, email, first_name, last_name, role, is_email_verified`,
        [
          userData.email,
          hashedPassword,
          firstName,
          lastName,
          UserRole.USER,
          true, // account is active
          true, // email is verified (since it's verified by Google)
          userData.id, // Google ID
        ],
      );

      user = result.rows[0];
    }

    // Generate JWT token for authentication
    const token = await generateJwtToken(user.id, user.email, user.role);

    // Redirect to frontend with token
    // In a production app, you might want to use a more secure method to transfer the token
    const redirectUrl = new URL(config.FRONTEND_URL || "http://localhost:3000");
    redirectUrl.searchParams.append("token", token);
    redirectUrl.searchParams.append("isNewUser", String(isNewUser));

    ctx.response.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Google OAuth callback error:", error);

    // Redirect to frontend with error
    const redirectUrl = new URL(config.FRONTEND_URL || "http://localhost:3000");
    redirectUrl.searchParams.append("error", "Authentication failed");

    ctx.response.redirect(redirectUrl.toString());
  }
}
