import { Context, Status } from "../../deps.ts";
import { getRedisClient } from "../db/redis.ts";
import { AppError } from "../utils/error.util.ts";

interface RateLimitOptions {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Maximum number of requests in the time window
  message?: string;  // Custom message to return when rate limit is exceeded
  keyGenerator?: (ctx: Context) => string; // Function to generate a unique key for the request
}

export function rateLimitMiddleware(options: RateLimitOptions) {
  const windowMs = options.windowMs || 60 * 1000; // Default: 1 minute
  const max = options.max || 100; // Default: 100 requests per window
  const message = options.message || "Too many requests, please try again later.";
  
  // Default key generator uses IP address
  const keyGenerator = options.keyGenerator || ((ctx: Context) => {
    const ip = ctx.request.ip || "unknown";
    return `rate-limit:${ip}`;
  });

  return async (ctx: Context, next: () => Promise<unknown>): Promise<void> => {
    const redis = getRedisClient();
    const key = keyGenerator(ctx);
    
    // Get current count for this key
    const current = await redis.get(key);
    const count = current ? parseInt(current) : 0;
    
    if (count >= max) {
      // Rate limit exceeded
      ctx.response.headers.set("Retry-After", Math.ceil(windowMs / 1000).toString());
      throw new AppError(message, Status.TooManyRequests);
    }
    
    // Increment the counter
    await redis.incr(key);
    
    // Set expiry if this is a new key
    if (count === 0) {
      await redis.expire(key, Math.ceil(windowMs / 1000));
    }
    
    // Add rate limit headers
    ctx.response.headers.set("X-RateLimit-Limit", max.toString());
    ctx.response.headers.set("X-RateLimit-Remaining", (max - count - 1).toString());
    
    await next();
  };
}