import { NextFunction } from "express";
import { ValidationError } from "../../../../packages/error_handler";
import findUserById from "../../../../packages/findUserByiD";

export const validateBusinessUser = async (user: any, next: NextFunction) => {
  const userID = user?.id;
  const accountType = user?.type;

  try {
    if (!userID) {
      return next(
        new ValidationError("Invalid or missing user ID", {
          statusCode: 400,
          errorCode: "INVALID_USER_ID",
        })
      );
    }

    if (!accountType) {
      return next(
        new ValidationError("User type missing in token", {
          statusCode: 400,
          errorCode: "USER_TYPE_MISSING",
        })
      );
    }

    if (accountType === "customer") {
      return next(
        new ValidationError("Unauthorized user type", {
          statusCode: 403,
          errorCode: "INVALID_USER_TYPE",
        })
      );
    }

    const foundUser = await findUserById(userID);
    if (!foundUser) {
      return next(
        new ValidationError("User not found", {
          statusCode: 404,
          errorCode: "USER_NOT_FOUND",
        })
      );
    }

    if ((foundUser as any).accountType === "customer") {
      return next(
        new ValidationError("Customer accounts cannot perform this action", {
          statusCode: 403,
          errorCode: "INVALID_ACCOUNT_TYPE",
        })
      );
    }

    return foundUser;
  } catch (error) {
    if (error instanceof Error) {
      return next(
        new ValidationError(error.message, {
          statusCode: 404,
          errorCode: "USER_NOT_FOUND",
        })
      );
    }
    return next(error);
  }
};
