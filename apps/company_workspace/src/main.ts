import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express from "express";
import * as path from "path";
import { dbConnect } from "../../../db/dbConnect";
import { errorMiddleware } from "../../../packages/error_handler/error_middleware";

const app = express();
const port = process.env.PORT || 3333;

// Database connection
dbConnect().catch((err) => {
  console.error("Failed to connect to MongoDB", err);
  process.exit(1);
});

// Middlewares

app.use(bodyParser.json());  //  to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // to support URL-encoded bodies
app.use(cookieParser()); // to support cookies
app.use("/assets", express.static(path.join(__dirname, "assets")));  // to serve static files
app.use(errorMiddleware);

app.get("/health", (req, res) => {
  res.send({ message: "OK!" });
});

app
  .listen(port, () => {
    console.log(`Company_Workspace running on port ${port}`);
  })
  .on("error", (err) => {
    console.error("company_workspace failed to start:", err);
    process.exit(1);
  });
