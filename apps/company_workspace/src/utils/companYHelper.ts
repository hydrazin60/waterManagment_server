import { Model, Document, Types } from "mongoose";
import { Admin } from "../../../../db/model/user/admin/Admin.model";
import { BusinessUser } from "../../../../db/model/user/BusinessUser/BusinessUser.model";
import { Staff } from "../../../../db/model/user/staff/staff.schema";
import { AuthError, NotFoundError, ValidationError } from "../../../../packages/error_handler";
import { NextFunction } from "express";
import { Company } from "../../../../db/model/company/companyData.model";
import { validateBusinessUser } from "./validateUser";
type UserType = "admin" | "business" | "staff" | "customer";

interface IUserResult<T> {
  user: T;
  userType: UserType;
}

export async function findUserByType(
  userId: Types.ObjectId,
  accountType: UserType
): Promise<IUserResult<any>> {
  let userModel: Model<any & Document>;

  switch (accountType) {
    case "admin":
      userModel = Admin;
      break;
    case "business":
      userModel = BusinessUser;
      break;
    case "staff":
      userModel = Staff;
      break;
    default:
      throw new AuthError("Invalid user type specified", { statusCode: 400, errorCode: "INVALID_USER_TYPE" });
  }

  const user = await userModel.findById(userId);
  if (!user) {
    throw new NotFoundError(`User not found in ${accountType} model`, {
      statusCode: 404,
      errorCode: `${accountType.toUpperCase()}_NOT_FOUND`,
    });
  }

  return { user, userType: accountType };
}

export const AdminUserFinder = async (user: any, next: NextFunction) => {
  try {
    const userId = user?.id;
    const accountType = user?.type;

    if (!userId) {
      return next(new NotFoundError("User not found", { statusCode: 401, errorCode: "UNAUTHORIZED" }));
    }
    if (accountType !== "admin") {
      return next(new AuthError("You are not authorized", { statusCode: 401, errorCode: "UNAUTHORIZED" }));
    }

    const admin = await Admin.findById(userId);
    if (!admin) {
      return next(new NotFoundError("Admin not found", { statusCode: 404, errorCode: "ADMIN_NOT_FOUND" }));
    }
    return admin;
  } catch (error) {
    return next(error);
  }
};

export const CompanyOwnerFinder = async (
  user: any, // Accept the whole user object
  companyId: Types.ObjectId | string,
  next: NextFunction
) => {
  try {
    // First validate the user
    const validatedUser = await validateBusinessUser(user, next);
    if (!validatedUser) return null; // Error already handled

    // Check if companyId is valid
    if (!Types.ObjectId.isValid(companyId)) {
      next(
        new ValidationError("Invalid company ID", {
          statusCode: 400,
          errorCode: "INVALID_COMPANY_ID",
        })
      );
      return null;
    }

    // Find the company and populate owners
    const company = await Company.findById(companyId).populate("owners");

    if (!company) {
      next(
        new ValidationError("Company not found", {
          statusCode: 404,
          errorCode: "COMPANY_NOT_FOUND",
        })
      );
      return null;
    }

    // Check if the user is one of the owners
    const isOwner = company.owners.some((owner: any) =>
      owner._id.equals((validatedUser as any).user._id)
    );

    if (!isOwner) {
      next(
        new ValidationError("User is not an owner of this company", {
          statusCode: 403,
          errorCode: "NOT_COMPANY_OWNER",
        })
      );
      return null;
    }

    return company;
  } catch (error) {
    if (error instanceof Error) {
      next(
        new ValidationError(error.message, {
          statusCode: 500,
          errorCode: "COMPANY_OWNER_CHECK_FAILED",
        })
      );
    } else {
      next(error);
    }
    return null;
  }
};