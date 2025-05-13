/**
 * utils/error.util.ts
 * @fileoverview Error classes for the application.
 */

import { Status } from "../../deps.ts";

export class AppError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number = Status.InternalServerError, errors?: Record<string, string[]>) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.errors = errors;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors: Record<string, string[]>) {
    super(message, Status.BadRequest, errors);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, Status.NotFound);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, Status.Unauthorized);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, Status.Forbidden);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, Status.Conflict);
  }
}