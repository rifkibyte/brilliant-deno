import { z } from "../../deps.ts";
import { Context, Status } from "../../deps.ts";
import { ValidationError } from "./error.util.ts";

export async function validateBody<T>(ctx: Context, schema: z.ZodSchema<T>): Promise<T> {
  try {
    const body = await ctx.request.body().value;
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string[]> = {};
      
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!formattedErrors[path]) {
          formattedErrors[path] = [];
        }
        formattedErrors[path].push(err.message);
      });
      
      throw new ValidationError("Validation failed", formattedErrors);
    }
    throw error;
  }
}

export async function validateQuery<T>(ctx: Context, schema: z.ZodSchema<T>): Promise<T> {
  try {
    const queryParams: Record<string, string> = {};
    for (const [key, value] of ctx.request.url.searchParams.entries()) {
      queryParams[key] = value;
    }
    
    return schema.parse(queryParams);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string[]> = {};
      
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!formattedErrors[path]) {
          formattedErrors[path] = [];
        }
        formattedErrors[path].push(err.message);
      });
      
      throw new ValidationError("Invalid query parameters", formattedErrors);
    }
    throw error;
  }
}

export async function validateParams<T>(ctx: Context, schema: z.ZodSchema<T>): Promise<T> {
  try {
    return schema.parse(ctx.params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string[]> = {};
      
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!formattedErrors[path]) {
          formattedErrors[path] = [];
        }
        formattedErrors[path].push(err.message);
      });
      
      throw new ValidationError("Invalid path parameters", formattedErrors);
    }
    throw error;
  }
}