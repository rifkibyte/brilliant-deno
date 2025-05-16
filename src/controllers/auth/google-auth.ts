import { Context, Status } from "~/deps.ts";
import { AppError } from "@/utils/error.util.ts";
import { config } from "@/config/config.ts";

/**
 * Google OAuth login
 * Initiates the Google OAuth authentication flow
 */
export async function googleAuth(ctx: Context): Promise<void> {
  try {
    // Create Google OAuth URL with required scopes
    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.GOOGLE_OAUTH.CLIENT_ID}&redirect_uri=${
        encodeURIComponent(config.GOOGLE_OAUTH.REDIRECT_URI)
      }&response_type=code&scope=email%20profile`;

    // Redirect the user to Google's authentication page
    ctx.response.redirect(googleAuthUrl);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to initiate Google authentication", Status.InternalServerError);
  }
}
