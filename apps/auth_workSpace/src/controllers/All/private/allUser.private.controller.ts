import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../../../../../packages/error_handler/error_middleware";
import mongoose from "mongoose";
import { ValidationError } from "../../../../../../packages/error_handler";
import { Admin } from "../../../../../../db/model/user/admin/Admin.model";
import { BusinessUser } from "../../../../../../db/model/user/BusinessUser/BusinessUser.model";
import CustomerUser from "../../../../../../db/model/user/customer/CustomerUser.model";
import { Staff } from "../../../../../../db/model/user/staff/staff.schema";

export const LogOut = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
    return res;
  }
);

export const GetOwnProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const userType = req.user?.type;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return next(
        new ValidationError("Invalid or missing user ID", {
          statusCode: 400,
          errorCode: "INVALID_USER_ID",
        })
      );
    }

    if (!userType) {
      return next(
        new ValidationError("User type missing in token", {
          statusCode: 400,
          errorCode: "USER_TYPE_MISSING",
        })
      );
    }

    let userData = null;
    switch (userType) {
      case "admin":
        userData = await Admin.findById(userId).select("-password");
        break;
      case "business":
        userData = await BusinessUser.findById(userId).select("-password");
        break;
      case "customer":
        userData = await CustomerUser.findById(userId).select("-password");
        break;
      case "staff":
        userData = await Staff.findById(userId).select("-password");
        break;
      default:
        return next(
          new ValidationError("Invalid user type", {
            statusCode: 400,
            errorCode: "INVALID_USER_TYPE",
          })
        );
    }

    if (!userData) {
      return next(
        new ValidationError("User not found", {
          statusCode: 404,
          errorCode: "USER_NOT_FOUND",
        })
      );
    }
    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: {
        type: userType,
        user: userData,
      },
    });
  }
);
