import express from "express";
import { adminRegistrationInitiate, verifyUserOTP } from "../../../../controllers/user/Admin/Admin.auth.controller";
 
const AdminAuthRouter = express.Router();
AdminAuthRouter.post("/register", adminRegistrationInitiate);
AdminAuthRouter.post("/verify-otp", verifyUserOTP);
// AdminAuthRouter.post("/login")
export default AdminAuthRouter;
