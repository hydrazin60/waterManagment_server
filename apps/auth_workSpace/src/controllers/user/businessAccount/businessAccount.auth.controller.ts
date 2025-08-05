import { NextFunction, Request, Response } from "express";

import bcrypt from "bcrypt";

import crypto from "crypto";
import { catchAsync } from "../../../../../../packages/error_handler/error_middleware";
import { ValidationError } from "../../../../../../packages/error_handler";
import { BusinessUser } from "../../../../../../db/model/user/BusinessUser/BusinessUser.model";
import {
  checkOtpRestrictions,
  sendOTP,
  trackOTPRequests,
  validateBusinessRegistrationData,
  verifyOTP,
} from "../../../utils/auth/auth.helper";
import { Admin } from "../../../../../../db/model/user/admin/Admin.model";
import CustomerUser from "../../../../../../db/model/user/customer/CustomerUser.model";
import { Staff } from "../../../../../../db/model/user/staff/staff.schema";
import redis from "../../../../../../packages/redis";
export const businessUserRegistrationInitiate = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, phone } = req.body;

    // Basic validation
    if (!email && !phone) {
      return next(
        new ValidationError("Email or phone number is required", {
          statusCode: 400,
          errorCode: "MISSING_IDENTIFIER",
        })
      );
    }

    try {
      // Check across all user collections if email provided
      if (email && (await checkEmailAcrossAllCollections(email))) {
        return next(
          new ValidationError("Email already registered in our system", {
            statusCode: 409,
            errorCode: "EMAIL_EXISTS",
            suggestion: "Please login or contact support",
          })
        );
      }

      // Check if phone number exists if phone provided
      if (phone && (await BusinessUser.exists({ phone }))) {
        return next(
          new ValidationError("Phone number already registered", {
            statusCode: 409,
            errorCode: "PHONE_EXISTS",
          })
        );
      }

      // Check OTP restrictions
      const identifier = email || phone;
      await checkOtpRestrictions(identifier, next);
      await trackOTPRequests(identifier, next);

      // Send OTP
      const otp = await sendOTP({
        email: identifier, // Works for phone too since we're using same redis key pattern
        template: "user-activation-mail",
      });
      console.log("OTP sent:", otp);
      res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        data: {
          identifier: email || phone,
          otpExpiresIn: "5 minutes",
          otpReference: generateOtpReference(identifier),
        },
      });
    } catch (err) {
      return next(
        new ValidationError("Business user registration initiation failed", {
          statusCode: 500,
          errorCode: "REGISTRATION_ERROR",
          originalError: err,
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

export const verifyBusinessUserOTP = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(
        new ValidationError("Email and OTP are required", {
          statusCode: 400,
          errorCode: "MISSING_FIELDS",
        })
      );
    }

    try {
      // Verify OTP
      const isOTPValid = await verifyOTP(email, otp);
      if (!isOTPValid) {
        return next(
          new ValidationError("OTP verification failed", {
            statusCode: 401,
            errorCode: "INVALID_OTP",
          })
        );
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Store both token and email in Redis with 1 hour expiration
      await redis.set(`verification:${verificationToken}`, email, "EX", 3600);

      // Also store email-to-token mapping for easy lookup
      await redis.set(
        `email_verification:${email}`,
        verificationToken,
        "EX",
        3600
      );

      res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        data: {
          verificationToken,
          expiresIn: "60 minutes",
        },
      });
    } catch (err) {
      return next(
        new ValidationError("OTP verification failed", {
          statusCode: 500,
          errorCode: "VERIFICATION_ERROR",
          details: err instanceof Error ? err.message : "Unknown error",
        })
      );
    }
  }
);

// businessAccount.auth.controller.ts
// businessAccount.auth.controller.ts
export const businessUserRegistrationComplete = catchAsync(
  // business user registration complete
  async (req: Request, res: Response, next: NextFunction) => {
    const { verificationToken, ...userData } = req.body;

    // Validate input data
    const { valid, error } = validateBusinessRegistrationData(req.body);
    if (!valid && error) {
      return next(error);
    }

    if (!verificationToken) {
      return next(
        new ValidationError("Verification token is required", {
          statusCode: 400,
          errorCode: "MISSING_TOKEN",
        })
      );
    }

    try {
      // Verify the token and get email
      const email = await redis.get(`verification:${verificationToken}`);
      if (!email) {
        return next(
          new ValidationError("Invalid or expired verification token", {
            statusCode: 401,
            errorCode: "INVALID_TOKEN",
          })
        );
      }

      // Check if user exists
      const existingUser = await BusinessUser.findOne({ email });
      if (existingUser) {
        return next(
          new ValidationError("Business user already registered", {
            statusCode: 409,
            errorCode: "USER_EXISTS",
          })
        );
      }

      // Create business user without company
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const newBusinessUser = await BusinessUser.create({
        name: userData.name,
        email,
        phone: userData.phone,
        password: hashedPassword,
        roleInCompany: userData.roleInCompany,
        permanentAddress: userData.permanentAddress,
        temporaryAddress: userData.temporaryAddress || null,
        isEmailVerified: true,
        isActive: true,
        // Company can be added later
      });

      // Cleanup verification data
      await redis.del(`verification:${verificationToken}`);
      await redis.del(`email_verification:${email}`);

      // Return response
      const responseData = {
        id: newBusinessUser._id,
        name: newBusinessUser.name,
        email: newBusinessUser.email,
        roleInCompany: newBusinessUser.roleInCompany,
        isEmailVerified: newBusinessUser.isEmailVerified,
        createdAt: newBusinessUser.createdAt,
      };

      res.status(201).json({
        success: true,
        message: "Business user  registration completed",
        data: responseData,
      });
    } catch (err) {
      return next(
        new ValidationError("Registration completion failed", {
          statusCode: 500,
          errorCode: "REGISTRATION_ERROR",
          details: err instanceof Error ? err.message : "Unknown error",
        })
      );
    }
  }
);
