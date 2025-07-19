import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { catchAsync } from "../../../../../../packages/error_handler/error_middleware";
import {
  findUserByEmail,
  getUserModelName,
  getUserRoleSpecificData,
  validateLoginData,
} from "../../../utils/auth/login.helper";
import {
  AuthError,
  ValidationError,
} from "../../../../../../packages/error_handler";
import { setCookies } from "../../../utils/cookies/setCookies";

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { valid, error } = validateLoginData(req.body);
    if (!valid && error) {
      return next(error);
    }

    const { email, password } = req.body;
    // Find user with proper typing
    const user = (await findUserByEmail(email)) as any;
    if (!user) {
      return next(
        new ValidationError("You are not registered", {
          email,
          suggestion: "Please register first",
          status: "user_not_found",
        })
      );
    }
    // Check password using the matchPassword method
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(
        new AuthError("Password is incorrect", {
          suggestion: "Please enter correct password",
          status: "invalid_credentials",
        })
      );
    }

    // Get role-specific data
    const userData = getUserRoleSpecificData(user);
    const userType = getUserModelName(user);

    // Generate tokens
    if (!process.env.JWT_SECRET_KEY) {
      throw new Error("JWT_SECRET_KEY is not configured");
    }

    // Common token payload
    const tokenPayload = {
      id: user._id,
      type: userType,
      email: user.email,
    };

    // Type-specific payload additions
    if ("customerType" in user) {
      Object.assign(tokenPayload, { customerType: user.customerType });
    }
    if ("roleInCompany" in user) {
      Object.assign(tokenPayload, { roleInCompany: user.roleInCompany });
    }

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET_KEY, {
      expiresIn: "1d",
    });

    const refreshToken = jwt.sign(
      { id: user._id, type: userType },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    // Set secure cookies
    setCookies(res, "accessToken", accessToken);
    setCookies(res, "refreshToken", refreshToken);
    // Prepare response data
    const responseData = {
      success: true,
      message: `Logged in successfully as ${userType}`,
      data: {
        user: userData,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    };

    res.status(200).json(responseData);
  }
);
