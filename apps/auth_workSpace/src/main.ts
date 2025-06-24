// apps/auth_workSpace/src/main.ts
import express from "express";
import bodyParser from "body-parser";
import adminAuthRouter from "./routes/admin/Admin.auth.routes";
import { dbConnect } from "../../../db/dbConnect";
import { swaggerDocs } from "./Swagger";

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
app.use("/api/v1/Ad_water-supply/Admin/auth", adminAuthRouter);

// Error handling
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Auth service error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);
swaggerDocs(app);

const port = process.env.AUTH_PORT || 5000;
app
  .listen(port, () => {
    console.log(`Auth service running on port ${port}`);
  })
  .on("error", (err) => {
    console.error("Auth service failed to start:", err);
    process.exit(1);
  });
