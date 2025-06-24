import { otpVerificationEmail } from "../service/email/emailVerifyOTP";
import redis from "../../../../packages/redis";
import crypto from "crypto";
import { ValidationError } from "../../../../packages/error_handler";
import { NextFunction } from "express";

interface RegistrationData {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  accountType?: string;
}

export const validateRegistrationData = (
  data: Partial<RegistrationData> = {}
): { valid: boolean; error?: ValidationError } => {
  const {
    name = "",
    email = "",
    password = "",
    phone = "",
    accountType = "",
  } = data;

  // Email validation
  if (!email.trim()) {
    return { valid: false, error: new ValidationError("Email is required") };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: new ValidationError("Invalid email format") };
  }

  // Password validation
  if (!password.trim()) {
    return { valid: false, error: new ValidationError("Password is required") };
  }

  if (password.length < 8) {
    return {
      valid: false,
      error: new ValidationError("Password must be at least 8 characters"),
    };
  }

  // For non-customer accounts (like admin)
  if (accountType !== "customer") {
    if (!name.trim()) {
      return { valid: false, error: new ValidationError("Name is required") };
    }
    if (!phone.trim()) {
      return { valid: false, error: new ValidationError("Phone is required") };
    }
    if (phone && !/^[0-9]{10,15}$/.test(phone)) {
      return {
        valid: false,
        error: new ValidationError("Invalid phone number"),
      };
    }
  }

  return { valid: true };
};
export const checkOtpRestrictions = async (
  email: string,
  next: NextFunction
): Promise<void> => {
  if (await redis.get(`otp_lock:${email}`)) {
    return next(
      new ValidationError(
        "Account is locked due to multiple failed attempts. Try again after 30 minutes."
      )
    );
  }

  if (await redis.get(`otp_spam_lock:${email}`)) {
    return next(
      new ValidationError(
        "Too many OTP requests. Please wait 1 hour before trying again."
      )
    );
  }

  if (await redis.get(`otp_cooldown:${email}`)) {
    return next(
      new ValidationError(
        "Too many OTP requests. Please wait 1 minute before trying again."
      )
    );
  }
};

interface SendOTPParams {
  email: string;
  template: "user-activation-mail";
}

export const sendOTP = async ({
  email,
  template,
}: SendOTPParams): Promise<string> => {
  const OTP = crypto.randomInt(1000, 9999).toString();

  switch (template) {
    case "user-activation-mail":
      await otpVerificationEmail(email, OTP);
      break;
    default:
      throw new Error(`Unsupported email template: ${template}`);
  }

  // Store OTP with 5 minute expiration
  await redis.set(`otp:${email}`, OTP, "EX", 300);

  // Set cooldown for 1 minute
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);

  return OTP;
};

export const trackOTPRequests = async (
  email: string,
  next: NextFunction
): Promise<void> => {
  const otpRequestKey = `otp_request_count:${email}`;
  const currentCount = parseInt((await redis.get(otpRequestKey)) || "0");

  if (currentCount >= 3) {
    await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600);
    return next(
      new ValidationError(
        "Too many OTP requests. Please wait 1 hour before trying again."
      )
    );
  }

  // Increment count and set 1 hour expiration
  await redis.set(otpRequestKey, (currentCount + 1).toString(), "EX", 3600);
};
