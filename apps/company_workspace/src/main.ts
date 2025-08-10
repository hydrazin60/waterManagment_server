import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { dbConnect } from "../../../db/dbConnect";
import { errorMiddleware } from "../../../packages/error_handler/error_middleware";
import companyRouter from "./routes/company.route";
import * as path from "path";
import branchRouter from "./routes/branch.routes";

const app = express();
const port = process.env.PORT || 3333;

// Database connection
dbConnect().catch((err) => {
  console.error("Failed to connect to MongoDB", err);
  process.exit(1);
});

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  })
);

// Request logging
app.use(morgan("dev"));

// Body parsing middleware (updated)
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Static files
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// API routes
app.use("/api/v1", companyRouter);
app.use("/api/v1", branchRouter)

// Error handling middleware (should be last)
app.use(errorMiddleware);
const server = app.listen(port, () => {
  console.log(`Company Service running on port ${port}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

export default app;
