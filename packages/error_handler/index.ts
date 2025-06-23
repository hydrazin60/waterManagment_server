// src/errors/AppError.ts

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(details?: any) {
    super("Resource not found 📄 ❌", 404, true, details);
  }
}

export class ValidationError extends AppError {
  constructor(details?: any) {
    super("Invalid request data ❌", 400, true, details);
  }
}

export class AuthError extends AppError {
  constructor(details?: any) {
    super("You are not authorized 🔐", 401, true, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(details?: any) {
    super("You cannot perform this action ⛔", 403, true, details);
  }
}

export class ServerError extends AppError {
  constructor(details?: any) {
    super("Something went wrong 😵‍💫! Please try again", 500, true, details);
  }
}

export class BadRequestError extends AppError {
  constructor(details?: any) {
    super("Bad request ⚠️", 400, true, details);
  }
}

export class DatabaseError extends AppError {
  constructor(details?: any) {
    super("Database error 💣", 500, true, details);
  }
}

export class RateLimitError extends AppError {
  constructor(details?: any) {
    super("Too many requests 🕒 Please try again later!", 429, true, details);
  }
}
