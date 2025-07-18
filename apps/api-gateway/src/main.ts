// apps/api-gateway/src/main.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import proxy from "express-http-proxy";
import { errorMiddleware } from "../../../packages/error_handler/error_middleware";
import { dbConnect } from "../../../db/dbConnect";
import dotenv from "dotenv";
dotenv.config();
const app = express();

// Database connection (remove from middleware)
dbConnect().catch((err) => {
  console.error("Failed to connect to MongoDB", err);
  process.exit(1);
});

// Middlewares
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
app.set("trust proxy", 1);

// CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Proxy configuration
app.use(
  "/auth",
  proxy("http://localhost:5000", {
    // proxyReqPathResolver: (req) => {
    //   return `/api/v1/Ad_water-supply/Admin/auth${req.url}`;
    // },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.timeout = 10000; // 10 second timeout
      return proxyReqOpts;
    },
  })
);

// Static assets
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling (must be last)
app.use(errorMiddleware);

const port = process.env.PORT || 6000;
app
  .listen(port, () => {
    console.log(`API Gateway running on port ${port}`);
  })
  .on("error", (err) => {
    console.error("Server error:", err);
    process.exit(1);
  });
