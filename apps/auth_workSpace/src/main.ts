import express from "express";
import bodyParser from "body-parser";
import { dbConnect } from "../../../db/dbConnect";
import { swaggerDocs } from "./Swagger";
import dotenv from "dotenv";
import { errorMiddleware } from "../../../packages/error_handler/error_middleware";
import allUserRouter from "./routes/public/user/All/alluser.routes";
import AdminAuthRouter from "./routes/public/user/admin/Admin.auth.routes";
import custommerRouter from "./routes/public/user/custommer/custommer.routes";

dotenv.config();
const app = express();

// Database connection
dbConnect().catch((err) => {
  console.error("Failed to connect to MongoDB", err);
  process.exit(1);
});

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/admin/auth", AdminAuthRouter);
app.use("/api/v1/allUser", allUserRouter);
app.use("/api/v1/custommer", custommerRouter);
// Swagger documentation
swaggerDocs(app);

// Use your proper error middleware (remove the basic one)
app.use(errorMiddleware);

const port = process.env.AUTH_PORT || 5000;
app
  .listen(port, () => {
    console.log(`Auth service running on port ${port}`);
  })
  .on("error", (err) => {
    console.error("Auth service failed to start:", err);
    process.exit(1);
  });
