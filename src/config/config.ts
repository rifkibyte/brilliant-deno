// Configuration settings loaded from environment variables

export const config = {
  // Server configuration
  PORT: parseInt(Deno.env.get("PORT") || "8000"),
  HOST: Deno.env.get("HOST") || "localhost",
  ENV: Deno.env.get("ENV") || "development",
  CORS_ORIGIN: Deno.env.get("CORS_ORIGIN") || "*",

  // Database configuration
  DB: {
    HOST: Deno.env.get("POSTGRES_HOST") || "localhost",
    PORT: parseInt(Deno.env.get("POSTGRES_PORT") || "5432"),
    USER: Deno.env.get("POSTGRES_USER") || "postgres",
    PASSWORD: Deno.env.get("POSTGRES_PASSWORD") || "postgres",
    DATABASE: Deno.env.get("POSTGRES_DB") || "learning_platform",
    POOL_SIZE: parseInt(Deno.env.get("POSTGRES_POOL_SIZE") || "10"),
  },

  // Redis configuration
  REDIS: {
    HOST: Deno.env.get("REDIS_HOST") || "localhost",
    PORT: parseInt(Deno.env.get("REDIS_PORT") || "6379"),
    PASSWORD: Deno.env.get("REDIS_PASSWORD") || "",
  },

  // JWT configuration
  JWT: {
    SECRET: Deno.env.get("JWT_SECRET") || "default_jwt_secret_key_change_in_production",
    EXPIRATION: parseInt(Deno.env.get("JWT_EXPIRATION") || "86400"), // 24 hours in seconds
  },

  // Google OAuth configuration
  GOOGLE_OAUTH: {
    CLIENT_ID: Deno.env.get("GOOGLE_CLIENT_ID") || "",
    CLIENT_SECRET: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
    REDIRECT_URI: Deno.env.get("GOOGLE_REDIRECT_URI") || "http://localhost:8000/api/auth/google/callback",
  },

  // Email configuration
  EMAIL: {
    SMTP_HOST: Deno.env.get("SMTP_HOST") || "",
    SMTP_PORT: parseInt(Deno.env.get("SMTP_PORT") || "587"),
    SMTP_USER: Deno.env.get("SMTP_USER") || "",
    SMTP_PASSWORD: Deno.env.get("SMTP_PASSWORD") || "",
    FROM: Deno.env.get("EMAIL_FROM") || "no-reply@learning-platform.com",
  },
};