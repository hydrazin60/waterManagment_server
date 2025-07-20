import { NextFunction, Request, Response } from "express";

import bcrypt from "bcrypt";
import { catchAsync } from "../../../../../../packages/error_handler/error_middleware";
import { checkOtpRestrictions, sendOTP, trackOTPRequests, validateRegistrationData, verifyOTP } from "../../../utils/auth/auth.helper";
import { ValidationError } from "../../../../../../packages/error_handler";
import { Admin } from "../../../../../../db/model/user/admin/Admin.model";
import { BusinessUser } from "../../../../../../db/model/user/BusinessUser/BusinessUser.model";
import CustomerUser from "../../../../../../db/model/user/customer/CustomerUser.model";
import { Staff } from "../../../../../../db/model/user/staff/staff.schema";

export const adminRegistrationInitiate = catchAsync(   // admin registration initiate
  async (req: Request, res: Response, next: NextFunction) => {
    const { valid, error } = validateRegistrationData(req.body);
    if (!valid && error) {
      return next(error);
    }

    const { email } = req.body;

    try {
      // Check across all user collections
      if (await checkEmailAcrossAllCollections(email)) {
        return next(
          new ValidationError("Email already registered in our system", {
            statusCode: 409,
            errorCode: "EMAIL_EXISTS",
            suggestion: "Please login or contact support",
          })
        );
      }

      // Check OTP restrictions
      await checkOtpRestrictions(email as string, next);
      await trackOTPRequests(email as string, next);

      // Send OTP
      const otp = await sendOTP({
        email,
        template: "user-activation-mail",
      });
      console.log(otp);
      res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        data: {
          email,
          otpExpiresIn: "5 minutes",
          otpReference: generateOtpReference(email),
        },
      });
    } catch (err) {
      return next(
        new ValidationError("Admin registration initiation failed", {
          statusCode: 500,
          errorCode: "REGISTRATION_ERROR",
          originalError: err,
        })
      );
    }
  }
);

export const adminRegistrationComplete = catchAsync(   // admin registration complete
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, phone, otp, role, permissions } = req.body;

    // Validate all required fields
    if (!name || !email || !password || !otp || !role) {
      return next(
        new ValidationError("Missing required fields", {
          statusCode: 400,
          errorCode: "MISSING_FIELDS",
        })
      );
    }

    try {
      // Verify OTP first
      const otpValid = await verifyOTP(email, otp);
      if (!otpValid) {
        return next(
          new ValidationError("Invalid or expired OTP", {
            statusCode: 401,
            errorCode: "INVALID_OTP",
          })
        );
      }

      // Final check if admin exists
      if (await Admin.exists({ email })) {
        return next(
          new ValidationError("Admin already registered", {
            statusCode: 409,
            errorCode: "ADMIN_EXISTS",
          })
        );
      }

      // Create admin with hashed password
      const hashedPassword = await bcrypt.hash(password, 12);
      const newAdmin = await Admin.create({
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        permissions,
        verified: true,
      });

      // Sanitize response
      const adminResponse = {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        createdAt: newAdmin.createdAt,
      };

      res.status(201).json({
        success: true,
        message: "Admin registration completed",
        data: adminResponse,
      });
    } catch (err) {
      return next(
        new ValidationError("Registration initiation failed", {
          statusCode: 500,
          errorCode: "REGISTRATION_ERROR",
          details: err,
        })
      );
    }
  }
);

// Helper Functions
async function checkEmailAcrossAllCollections(email: string): Promise<boolean> {
  const [admin, business, customer, staff] = await Promise.all([
    Admin.exists({ email }),
    BusinessUser.exists({ email }),
    CustomerUser.exists({ email }),
    Staff.exists({ email }),
  ]);
  return !!(admin || business || customer || staff);
}

function generateOtpReference(email: string): string {
  return Buffer.from(`${email}:${Date.now()}`).toString("base64").slice(0, 32);
}

export const verifyUserOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
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
