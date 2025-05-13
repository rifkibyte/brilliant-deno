/**
 * utils/response.util.ts
 * @fileoverview This file contains functions for sending responses to the client.
 */

import { Context, Status } from "../../deps.ts";

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

interface ErrorResponse {
  success: false;
  message: string;
  data: null;
  errors?: Record<string, string[]>;
}

export function sendSuccess<T>(
  ctx: Context, 
  data: T, 
  message: string = "Success", 
  status: number = Status.OK,
  meta?: Record<string, unknown>
): void {
  ctx.response.status = status;
  ctx.response.body = {
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  } as SuccessResponse<T>;
}

export function sendError(
  ctx: Context, 
  message: string = "Error", 
  status: number = Status.InternalServerError,
  errors?: Record<string, string[]>
): void {
  ctx.response.status = status;
  ctx.response.body = {
    success: false,
    message,
    data: null,
    ...(errors ? { errors } : {}),
  } as ErrorResponse;
}

export function sendCreated<T>(
  ctx: Context, 
  data: T, 
  message: string = "Resource created successfully"
): void {
  sendSuccess(ctx, data, message, Status.Created);
}

export function sendNoContent(ctx: Context): void {
  ctx.response.status = Status.NoContent;
}

export function sendBadRequest(
  ctx: Context, 
  message: string = "Bad request", 
  errors?: Record<string, string[]>
): void {
  sendError(ctx, message, Status.BadRequest, errors);
}

export function sendUnauthorized(
  ctx: Context, 
  message: string = "Unauthorized"
): void {
  sendError(ctx, message, Status.Unauthorized);
}

export function sendForbidden(
  ctx: Context, 
  message: string = "Forbidden"
): void {
  sendError(ctx, message, Status.Forbidden);
}

export function sendNotFound(
  ctx: Context, 
  message: string = "Resource not found"
): void {
  sendError(ctx, message, Status.NotFound);
}

export function sendConflict(
  ctx: Context, 
  message: string = "Conflict", 
  errors?: Record<string, string[]>
): void {
  sendError(ctx, message, Status.Conflict, errors);
}