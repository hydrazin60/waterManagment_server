// src/api/company/controllers/fetchSingleCompanyBYOwner.ts

import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../../../../packages/error_handler/error_middleware";
import { validateBusinessUser } from "../../utils/validateUser";
import { DatabaseError, ServerError } from "../../../../../packages/error_handler";

import mongoose from "mongoose";

// Import all possible referenced models for dynamic population
import { Admin } from "../../../../../db/model/user/admin/Admin.model";
import { BusinessUser } from "../../../../../db/model/user/BusinessUser/BusinessUser.model";
import { Company } from "../../../../../db/model/company/companyData.model";

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
          .populate("createdBy", "name email phone");

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


// import { NextFunction, Request, Response } from "express";
// import { catchAsync } from "../../../../../packages/error_handler/error_middleware";
// import { validateBusinessUser } from "../../utils/validateUser";
// import { DatabaseError, ServerError } from "../../../../../packages/error_handler";
// import { Company } from "../../../../../db/model/company/companyData.model";
 
// import mongoose from "mongoose";

// export const fetchSingleCompanyBYOwner = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { companyId } = req.params;
//     try {
//       const user = await validateBusinessUser(req.user, next);
//       if (!user || !user.user || !user.user._id) {
//         return next(
//           new DatabaseError("User not found or unauthorized", {
//             statusCode: 401,
//             errorCode: "UNAUTHORIZED",
//           })
//         );
//       }

//       if (mongoose.Types.ObjectId.isValid(companyId)) {
//         const company = await Company.findById(companyId);
//         if (!company) {
//           return next(
//             new DatabaseError("Company not found", {
//               statusCode: 404,
//               errorCode: "COMPANY_NOT_FOUND",
//             })
//           );
//         }
//       }

//       if (user.user.accountType === "admin") {
//         const company = await Company.findById(companyId)
//           .populate("owners", "name email phone")
//           .populate("createdBy", "name email phone");

//         return res.status(200).json({
//           status: "success",
//           message: "Company details fetched successfully",
//           data: company,
//         });
//       } else if (user.user.accountType === "business") {
//         const company = await Company.findOne({
//           _id: new mongoose.Types.ObjectId(companyId),
//           owners: { $in: [new mongoose.Types.ObjectId(req.user?.id)] },
//         })
//           .populate("owners", "email name")
//           .populate("createdBy", "email name");

//         if (!company) {
//           return res.status(404).json({
//             status: "fail",
//             message: "Company not found or owner does not match",
//           });
//         }
//         return res.status(200).json({
//           status: "success",
//           message: "Company details fetched successfully",
//           data: company,
//         });
//       }
//     } catch (error) {
//       console.error("Error in fetchSingleCompanyBYOwner:", error);
//       return next(
//         new ServerError("Internal server error", {
//           statusCode: 500,
//           errorCode: "SERVER_ERROR",
//         })
//       )
//     }
//   }
// );
