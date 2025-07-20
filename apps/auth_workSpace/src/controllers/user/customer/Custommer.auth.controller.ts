import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { catchAsync } from "../../../../../../packages/error_handler/error_middleware";
import {
  checkOtpRestrictions,
  sendOTP,
  trackOTPRequests,
  validateRegistrationData,
  verifyOTP,
} from "../../../utils/auth/auth.helper";
import { ValidationError } from "../../../../../../packages/error_handler";
import { Admin } from "../../../../../../db/model/user/admin/Admin.model";
import { BusinessUser } from "../../../../../../db/model/user/BusinessUser/BusinessUser.model";
import CustomerUser from "../../../../../../db/model/user/customer/CustomerUser.model";
import { Staff } from "../../../../../../db/model/user/staff/staff.schema";

export const CreateAccount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { valid, error } = validateRegistrationData(req.body);
    if (!valid && error) {
      return next(error);
    }

    const { email } = req.body;

    try {
      if (await checkEmailAcrossAllCollections(email)) {
        return next(
          new ValidationError("Email already registered", {
            statusCode: 409,
            errorCode: "EMAIL_EXISTS",
            suggestion: "Try logging in or use a different email",
          })
        );
      }

      await checkOtpRestrictions(email as string, next);
      await trackOTPRequests(email as string, next);
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
        new ValidationError("Registration initiation failed", {
          statusCode: 500,
          errorCode: "REGISTRATION_ERROR",
          details: err,
        })
      );
    }
  }
);

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

export const verifyCustomerOTP = async (
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
      role = "customer",
      permanentAddress,
      temporaryAddress,
      identityDocument,
      permissions = {},
    } = req.body;

    // Validate required fields
    if (!email || !otp || !password) {
      return next(new ValidationError("Please provide all required fields"));
    }
    const existingUser = await CustomerUser.findOne({ email });
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
    const newCustomer = new CustomerUser({
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

    await newCustomer.save();
    const CustomerData = newCustomer.toObject() as any;
    delete CustomerData.password;
    delete CustomerData.resetPasswordToken;
    delete CustomerData.resetPasswordExpire;

    res.status(201).json({
      success: true,
      message: `${email} registered successfully`,
      data: CustomerData,
    });
  } catch (err) {
    console.error("Verification error:", err);
    next(err);
  }
};
