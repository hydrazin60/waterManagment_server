import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import * as path from "path";
import proxy from "express-http-proxy";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: any) => (req.user ? 1000 : 100),
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.ip,
});
app.use(limiter as any);
app.set("trust proxy", 1);
app.use(
  cors({
    origin: "http://localhost:3000",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(
  "/",
  proxy("http://localhost:3333") as unknown as express.RequestHandler
);
app.get("/api", (req, res) => {
  res.send({ message: "Welcome to api-gateway!" });
});
const port = process.env.PORT || 6000;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on("error", console.error);
