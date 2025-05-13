// Standard library dependencies
export * as path from "https://deno.land/std@0.221.0/path/mod.ts";
export * as log from "https://deno.land/std@0.221.0/log/mod.ts";
export { ConsoleHandler } from "https://deno.land/std@0.221.0/log/console_handler.ts";
export { serve } from "https://deno.land/std@0.221.0/http/server.ts";
export { load as dotenvConfig } from "https://deno.land/std@0.221.0/dotenv/mod.ts";

// Third-party dependencies
export { Application, Router, Context, Status } from "https://deno.land/x/oak@v12.6.1/mod.ts";
export type { RouterContext, Middleware } from "https://deno.land/x/oak@v12.6.1/mod.ts";
export { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

// Database
export { Pool, PoolClient } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
export type { QueryObjectResult } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Redis
export { connect as redisConnect } from "https://deno.land/x/redis@v0.29.3/mod.ts";
export type { Redis } from "https://deno.land/x/redis@v0.29.3/mod.ts";

// Authentication
export { create as createJwt, verify as verifyJwt, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";
export type { Payload as JwtPayload } from "https://deno.land/x/djwt@v2.8/mod.ts";

// Validation
export { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Utilities
export { v4 as uuid } from "https://deno.land/std@0.221.0/uuid/mod.ts";
export { crypto } from "https://deno.land/std@0.221.0/crypto/mod.ts";
export { encodeHex } from "https://deno.land/std@0.221.0/encoding/hex.ts";