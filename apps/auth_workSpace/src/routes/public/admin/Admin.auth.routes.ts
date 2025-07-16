import express from "express";
import {
  adminRegistration,
  verifyUserOTP,
} from "../../../controllers/Admin/Admin.auth.controller";
const AdminAuthRouter = express.Router();
AdminAuthRouter.post("/register", adminRegistration);
AdminAuthRouter.post("/verify-otp", verifyUserOTP);

export default AdminAuthRouter;
