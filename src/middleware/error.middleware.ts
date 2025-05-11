import { Context, Status, log } from "../../deps.ts";
import { AppError } from "../utils/error.util.ts";

const logger = log.getLogger();

export async function errorMiddleware(ctx: Context, next: () => Promise<unknown>): Promise<void> {
  try {
    await next();
  } catch (err) {
    logger.error(`Error: ${err.message}`);
    
    if (err instanceof AppError) {
      ctx.response.status = err.status;
      ctx.response.body = {
        success: false,
        message: err.message,
        data: null,
        errors: err.errors,
      };
    } else {
      // For unexpected errors
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        success: false,
        message: "Internal Server Error",
        data: null,
        errors: config.ENV === "development" ? err.message : undefined,
      };
    }
  }
}

// Import config here to avoid circular dependency
import { config } from "../config/config.ts";