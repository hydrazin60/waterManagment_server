// src/api/company/controllers/fetchSingleCompanyBYOwner.ts

import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../../../../packages/error_handler/error_middleware";
import { validateBusinessUser } from "../../utils/validateUser";
import { DatabaseError, ServerError, ValidationError } from "../../../../../packages/error_handler";

import mongoose from "mongoose";

// Import all possible referenced models for dynamic population
import { Admin } from "../../../../../db/model/user/admin/Admin.model";
import { BusinessUser } from "../../../../../db/model/user/BusinessUser/BusinessUser.model";
import { Company } from "../../../../../db/model/company/companyData.model";
import { findUserByType } from "../../utils/companYHelper";
import { Branch } from "../../../../../db/model/Branch/branch.model";
type UserType = "admin" | "business" | "staff" | "customer";

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

      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return next(
          new DatabaseError("Invalid company ID", {
            statusCode: 400,
            errorCode: "INVALID_COMPANY_ID",
          })
        );
      }

      // Check if company exists first
      const companyExists = await Company.findById(companyId);
      if (!companyExists) {
        return next(
          new DatabaseError("Company not found", {
            statusCode: 404,
            errorCode: "COMPANY_NOT_FOUND",
          })
        );
      }

      // For admin users: get company by ID and populate owners and createdBy dynamically
      if (user.user.accountType === "admin") {
        const company = await Company.findById(companyId)
          .populate("owners", "name email phone")
          .populate("createdBy", "name email phone");

        return res.status(200).json({
          status: "success",
          message: "Company details fetched successfully",
          data: company,
        });
      }

      // For business users: ensure they own the company and then return it
      else if (user.user.accountType === "business") {
        const company = await Company.findOne({
          _id: new mongoose.Types.ObjectId(companyId),
          owners: { $in: [new mongoose.Types.ObjectId(req.user?.id)] },
        })
          .populate("owners", "name email phone")
          .populate({ path: "createdBy", select: "name phone email", refPath: "createdByModel" } as any);

        if (!company) {
          return res.status(404).json({
            status: "fail",
            message: "Company not found or owner does not match",
          });
        }

        return res.status(200).json({
          status: "success",
          message: "Company details fetched successfully",
          data: company,
        });
      }

      // If user accountType is neither admin nor business
      return next(
        new DatabaseError("Unauthorized user type", {
          statusCode: 403,
          errorCode: "UNAUTHORIZED_USER_TYPE",
        })
      );

    } catch (error) {
      console.error("Error in fetchSingleCompanyBYOwner:", error);
      return next(
        new ServerError("Internal server error", {
          statusCode: 500,
          errorCode: "SERVER_ERROR",
        })
      );
    }
  }
);

export const fetchBranchListOfoneCompany = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const auther = await findUserByType(
      new mongoose.Types.ObjectId(req.user?.id),
      req.user?.type as UserType
    );

    if (!auther) {
      return next(
        new DatabaseError("Unauthorized user type", {
          statusCode: 403,
          errorCode: "UNAUTHORIZED_USER_TYPE",
        })
      );
    }

    let company;

    if (auther.user.accountType === "admin") {
      // Admin can fetch any company
      company = await Company.findById(req.params.companyId);
      if (!company) {
        return next(
          new DatabaseError("Company not found", {
            statusCode: 404,
            errorCode: "COMPANY_NOT_FOUND",
          })
        );
      }
    } else if (auther.user.accountType === "business") {
      // Business can fetch only their own companies
      company = await Company.findOne({
        _id: req.params.companyId,
        createdBy: auther.user._id,
        ownerModel: "BusinessUser",
      });
      if (!company) {
        return next(
          new DatabaseError("Company not found or not owned by you", {
            statusCode: 404,
            errorCode: "COMPANY_NOT_FOUND_OR_UNAUTHORIZED",
          })
        );
      }
    } else {
      return next(
        new DatabaseError("Account type not allowed", {
          statusCode: 403,
          errorCode: "ACCOUNT_TYPE_NOT_ALLOWED",
        })
      );
    }

    // --- Branch Search ---
    const branchList = await Branch.find({
      _id: { $in: company.branches },
      company: company._id,
    })
      .select(
        "branchName description branchType isActive contact address branchLogo"
      )
      .populate({
        path: "branchManager",
        select: "name phone email",
        model: "Worker",
      })
      .populate({
        path: "company",
        select: "companyName",
        model: "Company",
      })
      .populate({
        path: "createdBy",
        select: "name phone email",
        refPath: "createdByModel",
      } as any)

    return res.status(200).json({
      status: "success",
      message: "Branch list fetched successfully",
      data: branchList,
    });
  }
);

export const fetchOneBranchData = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedUser = await validateBusinessUser(req.user, next);
    if (!validatedUser || !validatedUser.user || !validatedUser.user._id) {
      return next(
        new DatabaseError("User not found or unauthorized", {
          statusCode: 401,
          errorCode: "UNAUTHORIZED",
        })
      );
    }

    const { branchId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return next(
        new ValidationError("Invalid branch ID", {
          statusCode: 400,
          errorCode: "INVALID_BRANCH_ID",
        })
      );
    }

    let branch;

    // ---------------- ADMIN ----------------
    if (validatedUser.user.accountType === "admin") {
      branch = await Branch.findById(branchId)
        .select("branchName description branchType isActive contact address branchLogo company")
        .populate({ path: "branchManager", select: "name phone email" })
        .populate({ path: "company", select: "companyName" })
        .populate({ path: "createdBy", select: "name phone email", refPath: "createdByModel" } as any);

      if (!branch) {
        return next(
          new DatabaseError("Branch not found", {
            statusCode: 404,
            errorCode: "BRANCH_NOT_FOUND",
          })
        );
      }
    }

    // ---------------- BUSINESS ----------------
    else if (validatedUser.user.accountType === "business") {
      branch = await Branch.findOne({
        _id: branchId,
        company: { $in: validatedUser.user.companies }, // only from own companies
      })
        .select("branchName description branchType isActive contact address branchLogo company")
        .populate({ path: "branchManager", select: "name phone email" })
        .populate({ path: "company", select: "companyName" })
        .populate({ path: "createdBy", select: "name phone email", refPath: "createdByModel" } as any);

      if (!branch) {
        return next(
          new DatabaseError("Branch not found or unauthorized", {
            statusCode: 404,
            errorCode: "BRANCH_NOT_FOUND_OR_UNAUTHORIZED",
          })
        );
      }
    }

    // ---------------- OTHER ACCOUNT TYPES ----------------
    else {
      return next(
        new DatabaseError("Account type not allowed", {
          statusCode: 403,
          errorCode: "ACCOUNT_TYPE_NOT_ALLOWED",
        })
      );
    }

    return res.status(200).json({
      status: "success",
      message: "Branch details fetched successfully",
      data: branch,
    });
  }
);
