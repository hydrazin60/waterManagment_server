import e from "express";
import { businessUserRegistrationComplete, businessUserRegistrationInitiate, verifyBusinessUserOTP } from "../../../../controllers/user/businessAccount/businessAccount.auth.controller";
 
const businessAccountRouter = e.Router();
businessAccountRouter.post("/register", businessUserRegistrationInitiate);
businessAccountRouter.post("/verify-otp", verifyBusinessUserOTP);
businessAccountRouter.post(
  "/complide/register",
  businessUserRegistrationComplete
);
export default businessAccountRouter;
