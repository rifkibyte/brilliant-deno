import { Context, Status, verifyJwt, JwtPayload, log } from "../../deps.ts";
import { config } from "../config/config.ts";
import { getCache } from "../db/redis.ts";
import { AppError } from "../utils/error.util.ts";
import { UserRole } from "../types/user.types.ts";

const logger = log.getLogger();

export async function authMiddleware(ctx: Context, next: () => Promise<unknown>): Promise<void> {
  try {
    // Get the authorization header
    const authHeader = ctx.request.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Unauthorized: No token provided", Status.Unauthorized);
    }
    
    // Extract the token
    const token = authHeader.split(" ")[1];
    
    // Check if token is blacklisted (logged out)
    const isBlacklisted = await getCache(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AppError("Unauthorized: Token is invalid", Status.Unauthorized);
    }
    
    // Verify the token
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(config.JWT.SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const payload = await verifyJwt(token, key);
    
    // Set the user in the context state
    ctx.state.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    
    await next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    throw new AppError("Unauthorized: Invalid token", Status.Unauthorized);
  }
}

export function roleMiddleware(allowedRoles: UserRole[]) {
  return async (ctx: Context, next: () => Promise<unknown>): Promise<void> => {
    if (!ctx.state.user) {
      throw new AppError("Unauthorized: Authentication required", Status.Unauthorized);
    }
    
    const userRole = ctx.state.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      throw new AppError("Forbidden: Insufficient permissions", Status.Forbidden);
    }
    
    await next();
  };
}