import { createJwt, getNumericDate, crypto, encodeHex } from "../../deps.ts";
import { config } from "../config/config.ts";
import { JwtUserPayload, UserRole } from "../types/user.types.ts";
import { setCache } from "../db/redis.ts";

// Generate JWT token for authenticated users
export async function generateJwtToken(
  userId: string,
  email: string,
  role: UserRole,
  expiresIn: number = config.JWT.EXPIRATION
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(config.JWT.SECRET),
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign"]
  );

  const payload: JwtUserPayload = {
    sub: userId,
    email,
    role,
    exp: getNumericDate(expiresIn),
  };

  return await createJwt({ alg: "HS256", typ: "JWT" }, payload, key);
}

// Hash password using SHA-256
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return encodeHex(new Uint8Array(hashBuffer));
}

// Verify password against stored hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Generate a random token (for email verification, password reset, etc.)
export function generateRandomToken(length: number = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return encodeHex(bytes);
}

// Blacklist a JWT token (for logout)
export async function blacklistToken(token: string, expiresIn: number = config.JWT.EXPIRATION): Promise<void> {
  await setCache(`blacklist:${token}`, "true", expiresIn);
}