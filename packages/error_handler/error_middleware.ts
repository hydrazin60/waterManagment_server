import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "./index"; // Make sure to import your custom errors
import { ServerError } from ".";

interface ErrorResponse {
  success: boolean;
  status: string;
  message: string;
  error?: {
    code: number;
    details?: any;
    stack?: string;
  };
  timestamp: string;
}

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error response
  const errorResponse: ErrorResponse = {
    success: false,
    status: "error",
    message: err.message || "Something went wrong!",
    timestamp: new Date().toISOString(),
  };

  // Handle custom AppError instances
  if (err instanceof AppError) {
    errorResponse.error = {
      code: err.statusCode,
      details: err.details,
    };

    // Include stack trace in development only
    if (process.env.NODE_ENV === "development") {
      errorResponse.error.stack = err.stack;
    }

    return res.status(err.statusCode).json(errorResponse);
  }

  // Handle specific ValidationError
  if (err instanceof ValidationError) {
    errorResponse.status = "fail";
    errorResponse.error = {
      code: err.statusCode,
      details: err.details || {
        message: "Validation failed",
        fields: Object.keys(req.body),
      },
    };

    return res.status(err.statusCode).json(errorResponse);
  }

  // Handle unexpected errors
  console.error("[UNHANDLED ERROR]", err);

  errorResponse.message = "Internal server error";
  errorResponse.error = {
    code: 500,
    details:
      process.env.NODE_ENV === "development"
        ? {
            name: err.name,
            message: err.message,
            stack: err.stack,
          }
        : undefined,
  };

  return res.status(500).json(errorResponse);
};

export const catchAsync =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      // Convert to AppError if not already
      if (!(err instanceof AppError)) {
        err = new ServerError(err.message, { originalError: err });
      }
      next(err);
    });
  };
