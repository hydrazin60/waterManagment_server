type ErrorDetails = Record<string, unknown> | string | unknown[];

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: ErrorDetails;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    details?: ErrorDetails
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    
    // Set prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Specific Error Classes
export class ValidationError extends AppError {
  constructor(message: string = "Invalid request data ❌", details?: ErrorDetails) {
    super(message, 400, true, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(details?: ErrorDetails) {
    super("Resource not found 📄 ❌", 404, true, details);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class AuthError extends AppError {
  constructor(details?: ErrorDetails) {
    super("You are not authorized 🔐", 401, true, details);
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(details?: ErrorDetails) {
    super("You cannot perform this action ⛔", 403, true, details);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ServerError extends AppError {
  constructor(details?: ErrorDetails) {
    super("Something went wrong 😵‍💫! Please try again", 500, true, details);
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(details?: ErrorDetails) {
    super("Bad request ⚠️", 400, true, details);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(details?: ErrorDetails) {
    super("Database error 💣", 500, true, details);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(details?: ErrorDetails) {
    super("Too many requests 🕒 Please try again later!", 429, true, details);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}