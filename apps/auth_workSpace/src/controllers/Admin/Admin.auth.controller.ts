import { NextFunction, Request, Response } from "express";
import { Admin } from "../../../../../db/model/user/admin/Admin.model";
import { ValidationError } from "../../../../../packages/error_handler";
import {
  checkOtpRestrictions,
  sendOTP,
  trackOTPRequests,
  validateRegistrationData,
} from "../../utils/auth.helper";

export const adminRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Request body:", req.body);
 
    const { valid, error } = validateRegistrationData(req.body);

    if (!valid && error) {
      return next(error); // This will trigger the error middleware
    }

    const { email } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return next(
        new ValidationError("Admin exists with this email/phone. Please login")
      );
    }

    // OTP flow
    await checkOtpRestrictions(email, next);
    await trackOTPRequests(email, next);
    await sendOTP({
      email,
      template: "user-activation-mail",
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    next(error); // Pass to error middleware
  }
};
