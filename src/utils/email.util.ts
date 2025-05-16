import { config } from "../config/config.ts";
import { EmailNotification } from "../types/notification.types.ts";
import { AppError } from "./error.util.ts";
import { Status } from "../../deps.ts";

/**
 * Send an email using the configured email service
 * @param options Email options including recipient, subject, and content
 */
export async function sendEmail(options: EmailNotification): Promise<void> {
  try {
    // Set default from address if not provided
    const from = options.from || config.EMAIL.FROM_ADDRESS;
    
    // Create email payload
    const emailPayload = {
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    };

    // For development environment, log the email instead of sending
    if (config.NODE_ENV === "development") {
      console.log("Email would be sent in production:");
      console.log(JSON.stringify(emailPayload, null, 2));
      return;
    }

    // In production, send the email using the configured email service
    // This implementation will depend on your email service provider
    // Example using a generic email API:
    const response = await fetch(config.EMAIL.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.EMAIL.API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send email: ${errorData.message || response.statusText}`);
    }
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new AppError("Failed to send email", Status.InternalServerError);
  }
}

/**
 * Helper function to strip HTML tags from content
 * @param html HTML content
 * @returns Plain text content
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "");
}