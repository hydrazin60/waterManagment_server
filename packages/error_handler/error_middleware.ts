import { Request, Response } from "express";
import { AppError } from "./index";

export const errorMiddleware = (err: Error, req: Request, res: Response) => {
  if (err instanceof AppError) {
    console.error(
      `[${req.method}] ${req.originalUrl} -> ${err.message} (${err.statusCode})`
    );

    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err.details && { details: err.details }),
      timestamp: new Date().toISOString(),
    });
  }

  console.error("Unhandled error:", err);

  return res.status(500).json({
    status: "error",
    message: "Something went wrong 😵‍💫! Please try again",
    timestamp: new Date().toISOString(),
  });
};
