import express from "express";
import { adminRegistrationInitiate, verifyUserOTP } from "../../../../controllers/Admin/Admin.auth.controller";
const AdminAuthRouter = express.Router();
AdminAuthRouter.post("/register", adminRegistrationInitiate);
AdminAuthRouter.post("/verify-otp", verifyUserOTP);
// AdminAuthRouter.post("/login")
export default AdminAuthRouter;
