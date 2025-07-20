import e from "express";
import { CreateAccount, verifyCustomerOTP } from "../../../../controllers/user/customer/Custommer.auth.controller";
 

const custommerRouter = e.Router();
custommerRouter.post("/register", CreateAccount);
custommerRouter.post("/verify-otp", verifyCustomerOTP);
export default custommerRouter;
