import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../../../../packages/error_handler/error_middleware";
import { validateBusinessUser } from "../../utils/validateUser";
import {
  DatabaseError,
  ValidationError,
} from "../../../../../packages/error_handler";
import { findUserByType } from "../../utils/FindUser";
import { Company } from "../../../../../db/model/company/companyData.model";
import mongoose from "mongoose";

export const fetchSingleCompanyBYOwner = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { companyId } = req.params;
    try {
      const user = await validateBusinessUser(req.user, next);
      if (!user || !user.user || !user.user._id) {
        return next(
          new DatabaseError("User not found or unauthorized", {
            statusCode: 401,
            errorCode: "UNAUTHORIZED",
          })
        );
      }

      // Explicitly create ObjectId
      const userId = (user.user as any)._id;
      const accountType = (user.user as any).accountType;
      if (accountType !== "admin" || accountType !== "business") {
        return next(
          new DatabaseError("You are not authorized to access this route", {
            statusCode: 403,
            errorCode: "UNAUTHORIZED",
          })
        );
      }
      try {
        const userData = await findUserByType(userId, accountType);
        if (!userData) {
          return next(
            new DatabaseError("User not found", {
              statusCode: 404,
              errorCode: "USER_NOT_FOUND",
            })
          );
        }
        if ((userData as any).accountType !== "admin") {
          if (
            (userData as any).company.toString() === null ||
            (userData as any).company.toString() !== companyId
          ) {
            return next(
              new DatabaseError("Company not found", {
                statusCode: 404,
                errorCode: "COMPANY_NOT_FOUND",
              })
            );
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          return next(
            new DatabaseError(error.message, {
              statusCode: 404,
              errorCode: "USER_NOT_FOUND",
            })
          );
        }
        return next(
          new DatabaseError("Unknown error occurred", {
            statusCode: 500,
            errorCode: "UNKNOWN_ERROR",
          })
        );
      }

      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return next(
          new ValidationError("Invalid company ID", {
            statusCode: 400,
            errorCode: "INVALID_COMPANY_ID",
          })
        );
      }
      const company = await Company.findById(companyId);
      if (!company) {
        return next(
          new ValidationError("Company not found", {
            statusCode: 404,
            errorCode: "COMPANY_NOT_FOUND",
          })
        );
      }
      res.status(200).json({
        status: "success",
        message: "Company details fetched successfully",
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }
);
