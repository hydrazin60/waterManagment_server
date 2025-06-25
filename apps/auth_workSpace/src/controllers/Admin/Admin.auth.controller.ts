import { NextFunction, Request, Response } from "express";
import { Admin } from "../../../../../db/model/user/admin/Admin.model";
import { ValidationError } from "../../../../../packages/error_handler";
import bcrypt from "bcrypt";
import {
  checkOtpRestrictions,
  sendOTP,
  trackOTPRequests,
  validateRegistrationData,
  verifyOTP,
} from "../../utils/auth.helper";

export const adminRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Registration request body:", req.body);

    const { valid, error } = validateRegistrationData(req.body);
    if (!valid && error) {
      return next(error);
    }

    const { email } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return next(
        new ValidationError(
          "Admin with this email already exists. Please login"
        )
      );
    }

    // OTP flow
    await checkOtpRestrictions(email, next);
    await trackOTPRequests(email, next);
    const otp = await sendOTP({
      email,
      template: "user-activation-mail",
    });

    console.log(`OTP sent to ${email}: ${otp}`);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        email,
        otpExpiresIn: "5 minutes", // Inform client about OTP expiration
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    next(error);
  }
};

export const verifyUserOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Verification request body:", req.body);

    const {
      name,
      email,
      phone,
      otp,
      password,
      role = "admin",
      permanentAddress,
      temporaryAddress,
      identityDocument,
      permissions = {},
    } = req.body;

    // Validate required fields
    if (!email || !otp || !password || !name || !permanentAddress) {
      return next(new ValidationError("Please provide all required fields"));
    }

    // Validate permanent address structure
    if (
      !permanentAddress.district ||
      !permanentAddress.country ||
      !permanentAddress.province ||
      !permanentAddress.zip
    ) {
      return next(
        new ValidationError("Complete permanent address is required")
      );
    }

    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      return next(new ValidationError("User already exists"));
    }

    // Verify OTP
    try {
      const isOTPValid = await verifyOTP(email, otp);
      if (!isOTPValid) {
        return next(new ValidationError("OTP verification failed"));
      }
    } catch (otpError) {
      return next(otpError);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const newAdmin = new Admin({
      name,
      email,
      phone,
      role,
      permanentAddress,
      temporaryAddress,
      identityDocument,
      permissions,
      password: hashedPassword,
    });

    await newAdmin.save();

    const adminData = newAdmin.toObject() as any;
    delete adminData.password;
    delete adminData.resetPasswordToken;
    delete adminData.resetPasswordExpire;

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: adminData,
    });
  } catch (err) {
    console.error("Verification error:", err);
    next(err);
  }
};
