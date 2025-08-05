import { catchAsync } from "../../../../packages/error_handler/error_middleware";
import { NextFunction, Request, Response } from "express";
import { validateBusinessUser } from "../utils/validateUser";
import { createCompanySchema } from "../helper/company.validation";
import {
  ValidationError,
  DatabaseError,
} from "../../../../packages/error_handler";
import { Company } from "../../../../db/model/company/companyData.model";
import { ActivityLog } from "../../../../db/model/activityLog/activityLog.model";
import mongoose from "mongoose";

export const RegisterNewCompany = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Validate user and extract user ID
      const user = await validateBusinessUser(req.user, next);
      console.log("Validated user:", user);

      if (!user || !user.user || !user.user._id) {
        return next(
          new DatabaseError("User not found or unauthorized", {
            statusCode: 401,
            errorCode: "UNAUTHORIZED",
          })
        );
      }

      const userId = user.user._id; // Extract the user ID from the nested user object

      // 2. Validate request data
      const parsed = createCompanySchema.safeParse(req.body);
      if (!parsed.success) {
        const errorMessages = parsed.error.issues.map(
          (err) => `${err.path.join(".")}: ${err.message}`
        );
        return next(
          new ValidationError("Input validation failed", {
            statusCode: 400,
            errorCode: "VALIDATION_ERROR",
            details: errorMessages,
            suggestion: "Please check all fields and try again",
          })
        );
      }

      const companyData = parsed.data;

      // 3. Check for existing company
      const existingCompany = await Company.findOne({
        $or: [
          { companyName: companyData.companyName },
          { taxIdentificationNumber: companyData.taxIdentificationNumber },
        ],
      });

      if (existingCompany) {
        let suggestion = "Please check your company details";
        if (existingCompany.companyName === companyData.companyName) {
          suggestion = "Company with this name already exists";
        } else {
          suggestion = "Company with this tax ID already exists";
        }
        return next(
          new ValidationError("Company already exists", {
            statusCode: 409,
            errorCode: "DUPLICATE_COMPANY",
            suggestion,
          })
        );
      }

      // 4. Create the new company with proper createdBy reference
      const newCompany = await Company.create({
        // Basic Company Info
        companyName: companyData.companyName,
        legalName: companyData.legalName,
        companyType: companyData.companyType,
        industry: companyData.industry,
        companyLogo: companyData.companyLogo,
        companyWebsite: companyData.companyWebsite,
        companyDescription: companyData.companyDescription,
        foundingDate: companyData.foundingDate,

        // Business Registration
        taxIdentificationNumber: companyData.taxIdentificationNumber,
        vatNumber: companyData.vatNumber,
        identityDocuments: {
          registrationNumber: companyData.identityDocuments?.registrationNumber,
          panNumber: companyData.identityDocuments.panNumber,
          panPhoto: companyData.identityDocuments?.panPhoto,
          taxClearanceCertificate:
            companyData.identityDocuments?.taxClearanceCertificate,
          vatRegistrationCertificate:
            companyData.identityDocuments?.vatRegistrationCertificate,
        },

        // Contact Information
        primaryEmail: companyData.primaryEmail,
        primaryPhone: companyData.primaryPhone,
        secondaryPhone: companyData.secondaryPhone,
        emergencyContact: companyData.emergencyContact,

        // Addresses
        operationalAddress: {
          district: companyData.operationalAddress.district,
          municipality: companyData.operationalAddress.municipality,
          city: companyData.operationalAddress.city,
          tole: companyData.operationalAddress.tole,
          nearFamousPlace: companyData.operationalAddress.nearFamousPlace,
          country: companyData.operationalAddress.country || "Nepal",
          province: companyData.operationalAddress.province,
          zip: companyData.operationalAddress.zip,
          coordinates: companyData.operationalAddress.coordinates,
        },
        warehouseLocations: companyData.warehouseLocations?.map((loc) => ({
          district: loc.district,
          municipality: loc.municipality,
          city: loc.city,
          tole: loc.tole,
          nearFamousPlace: loc.nearFamousPlace,
          country: loc.country || "Nepal",
          province: loc.province,
          zip: loc.zip,
          coordinates: loc.coordinates,
        })),

        // Financial Information
        bankDetails: companyData.bankDetails.map((bank) => ({
          accountNumber: bank.accountNumber,
          bankName: bank.bankName,
          branchName: bank.branchName,
          accountHolderName: bank.accountHolderName,
          bankQRCode: bank.bankQRCode,
          eSewaID: bank.eSewaID,
          eSewaQRCode: bank.eSewaQRCode,
          khaltiID: bank.khaltiID,
          khaltiQRCode: bank.khaltiQRCode,
        })),
        paymentMethods: companyData.paymentMethods,

        // Business Operations
        operatingHours: companyData.operatingHours
          ? {
              days: companyData.operatingHours.days,
              openingTime: companyData.operatingHours.openingTime || "08:00",
              closingTime: companyData.operatingHours.closingTime || "17:00",
            }
          : undefined,
        deliveryRadius: companyData.deliveryRadius,
        deliveryFee: companyData.deliveryFee,
        serviceAreas: companyData.serviceAreas,

        // Status & Verification
        isVerified: false,
        verificationStatus: "pending",
        isActive: true,

        // Metadata - Fixed createdBy reference
        createdBy: userId,
      });

      // 5. Create activity log
      await ActivityLog.create({
        action: "CREATE",
        entity: "Company",
        entityId: newCompany._id,
        performedBy: userId,
        performedByModel: "BusinessUser",
        metadata: {
          companyName: newCompany.companyName,
          companyType: newCompany.companyType,
        },
        timestamp: new Date(),
      });

      // 6. Prepare response (excluding sensitive fields)
      const responseData = newCompany.toObject();
      const { identityDocuments, bankDetails, __v, ...safeResponseData } =
        responseData;

      res.status(201).json({
        status: "success",
        message: "Company registered successfully and pending verification",
        data: safeResponseData,
      });
    } catch (error) {
      console.error("Registration error:", error);

      if (error instanceof mongoose.Error.ValidationError) {
        return next(
          new ValidationError("Database validation failed", {
            statusCode: 400,
            errorCode: "DB_VALIDATION_FAILED",
            details: error.message,
          })
        );
      }

      next(
        new DatabaseError("Company registration failed", {
          statusCode: 500,
          errorCode: "REGISTRATION_FAILED",
          originalError: error,
        })
      );
    }
  }
);

// import { NextFunction, Request, Response } from "express";
// import { validateBusinessUser } from "../utils/validateUser";
// import { createCompanySchema } from "../helper/company.validation";
// // import z from "zod";
// import {
//   ValidationError,
//   DatabaseError,
// } from "../../../../packages/error_handler";
// import { Company } from "../../../../db/model/company/companyData.model";

// import mongoose from "mongoose";
// import { ActivityLog } from "../../../../db/model/activityLog/activityLog.model";

// // export const RegisterNewCompany = catchAsync(
// //   async (req: Request, res: Response, next: NextFunction) => {
// //     const session = await mongoose.startSession();
// //     session.startTransaction();

// //     try {
// //       // Validate the business user making the request
// //       console.log(req.user);
// //       console.log(req.body);
// //       const user = await validateBusinessUser(req.user, next);

// //       if (!user) {
// //         return next(
// //           new DatabaseError("User not found or unauthorized", {
// //             statusCode: 401,
// //             errorCode: "UNAUTHORIZED",
// //           })
// //         );
// //       }

// //       // Validate the request body against the schema
// //       const parsed = createCompanySchema.safeParse(req.body);

// //       if (!parsed.success) {
// //         const errorMessages = parsed.error.issues.map(
// //           (err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`
// //         );

// //         return next(
// //           new ValidationError("Input validation failed", {
// //             statusCode: 400,
// //             errorCode: "VALIDATION_ERROR",
// //             details: errorMessages,
// //             suggestion: "Please check all fields and try again",
// //           })
// //         );
// //       }

// //       const companyData = parsed.data;

// //       // Check if company with same name or tax ID already exists
// //       const existingCompany = await Company.findOne({
// //         $or: [
// //           { companyName: companyData.companyName },
// //           { taxIdentificationNumber: companyData.taxIdentificationNumber },
// //         ],
// //       }).session(session);

// //       if (existingCompany) {
// //         let suggestion = "Please check your company details";
// //         if (existingCompany.companyName === companyData.companyName) {
// //           suggestion =
// //             "Company with this name already exists. Try a different company name.";
// //         } else if (
// //           existingCompany.taxIdentificationNumber ===
// //           companyData.taxIdentificationNumber
// //         ) {
// //           suggestion =
// //             "Company with this tax ID already exists. Check your tax identification number.";
// //         }

// //         return next(
// //           new ValidationError("Company already exists", {
// //             statusCode: 409,
// //             errorCode: "DUPLICATE_COMPANY",
// //             suggestion,
// //           })
// //         );
// //       }

// //       // Create the new company
// //       const newCompany = await Company.create(
// //         [
// //           {
// //             companyName: companyData.companyName,
// //             legalName: companyData.legalName,
// //             companyType: companyData.companyType,
// //             taxIdentificationNumber: companyData.taxIdentificationNumber,
// //             vatNumber: companyData.vatNumber,
// //             identityDocuments: {
// //               registrationNumber:
// //                 companyData.identityDocuments?.registrationNumber,
// //               panNumber: companyData.identityDocuments.panNumber,
// //               panPhoto: companyData.identityDocuments?.panPhoto,
// //               taxClearanceCertificate:
// //                 companyData.identityDocuments?.taxClearanceCertificate,
// //               vatRegistrationCertificate:
// //                 companyData.identityDocuments?.vatRegistrationCertificate,
// //             },
// //             primaryEmail: companyData.primaryEmail,
// //             primaryPhone: companyData.primaryPhone,
// //             secondaryPhone: companyData.secondaryPhone,
// //             emergencyContact: companyData.emergencyContact,
// //             operationalAddress: {
// //               district: companyData.operationalAddress.district,
// //               municipality: companyData.operationalAddress.municipality,
// //               city: companyData.operationalAddress.city,
// //               tole: companyData.operationalAddress.tole,
// //               nearFamousPlace: companyData.operationalAddress.nearFamousPlace,
// //               country: companyData.operationalAddress.country || "Nepal",
// //               province: companyData.operationalAddress.province,
// //               zip: companyData.operationalAddress.zip,
// //               coordinates: companyData.operationalAddress.coordinates,
// //             },
// //             warehouseLocations: companyData.warehouseLocations?.map((loc) => ({
// //               district: loc.district,
// //               municipality: loc.municipality,
// //               city: loc.city,
// //               tole: loc.tole,
// //               nearFamousPlace: loc.nearFamousPlace,
// //               country: loc.country || "Nepal",
// //               province: loc.province,
// //               zip: loc.zip,
// //               coordinates: loc.coordinates,
// //             })),
// //             bankDetails: companyData.bankDetails.map((bank) => ({
// //               accountNumber: bank.accountNumber,
// //               bankName: bank.bankName,
// //               branchName: bank.branchName,
// //               accountHolderName: bank.accountHolderName,
// //               bankQRCode: bank.bankQRCode,
// //               eSewaID: bank.eSewaID,
// //               eSewaQRCode: bank.eSewaQRCode,
// //               khaltiID: bank.khaltiID,
// //               khaltiQRCode: bank.khaltiQRCode,
// //             })),
// //             paymentMethods: companyData.paymentMethods,
// //             companyLogo: companyData.companyLogo,
// //             companyWebsite: companyData.companyWebsite,
// //             companyDescription: companyData.companyDescription,
// //             foundingDate: companyData.foundingDate,
// //             operatingHours: companyData.operatingHours && {
// //               days: companyData.operatingHours.days,
// //               openingTime: companyData.operatingHours.openingTime || "08:00",
// //               closingTime: companyData.operatingHours.closingTime || "17:00",
// //             },
// //             deliveryRadius: companyData.deliveryRadius,
// //             deliveryFee: companyData.deliveryFee,
// //             serviceAreas: companyData.serviceAreas,
// //             createdBy: (user as any)._id as mongoose.Types.ObjectId,
// //             isActive: true,
// //             verificationStatus: "pending",
// //             isVerified: false,
// //           },
// //         ],
// //         { session }
// //       );

// //       // Create activity log
// //       await ActivityLog.create(
// //         [
// //           {
// //             action: "CREATE",
// //             entity: "Company",
// //             entityId: newCompany[0]._id,
// //             performedBy: (user as any)._id as mongoose.Types.ObjectId,
// //             performedByModel: "BusinessUser",
// //             metadata: {
// //               companyName: newCompany[0].companyName,
// //               companyType: newCompany[0].companyType,
// //             },
// //             timestamp: new Date(),
// //           },
// //         ],
// //         { session }
// //       );

// //       await session.commitTransaction();

// //       // Return success response (excluding sensitive fields)
// //       const responseData = newCompany[0].toObject() as any;
// //       delete responseData.identityDocuments;
// //       delete responseData.operationalAddress;
// //       delete responseData.warehouseLocations;
// //       delete responseData.bankDetails;

// //       res.status(201).json({
// //         status: "success",
// //         message: "Company registered successfully and pending verification",
// //         data: responseData,
// //       });
// //     } catch (error) {
// //       await session.abortTransaction();
// //       next(
// //         new DatabaseError("Failed to register company", {
// //           statusCode: 500,
// //           errorCode: "DATABASE_ERROR",
// //           originalError: error,
// //         })
// //       );
// //     } finally {
// //       session.endSession();
// //     }
// //   }
// // );

// export const RegisterNewCompany = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//       // 1. Validate user
//       const user = await validateBusinessUser(req.user, next);
//       if (!user) {
//         return next(
//           new DatabaseError("User not found or unauthorized", {
//             statusCode: 401,
//             errorCode: "UNAUTHORIZED",
//           })
//         );
//       }

//       // 2. Validate request data
//       const parsed = createCompanySchema.safeParse(req.body);
//       if (!parsed.success) {
//         const errorMessages = parsed.error.issues.map(
//           (err) => `${err.path.join(".")}: ${err.message}`
//         );
//         return next(
//           new ValidationError("Input validation failed", {
//             statusCode: 400,
//             errorCode: "VALIDATION_ERROR",
//             details: errorMessages,
//             suggestion: "Please check all fields and try again",
//           })
//         );
//       }

//       const companyData = parsed.data;

//       // 3. Check for existing company
//       const existingCompany = await Company.findOne({
//         $or: [
//           { companyName: companyData.companyName },
//           { taxIdentificationNumber: companyData.taxIdentificationNumber },
//         ],
//       }).session(session);

//       if (existingCompany) {
//         let suggestion = "Please check your company details";
//         if (existingCompany.companyName === companyData.companyName) {
//           suggestion = "Company name already exists";
//         } else {
//           suggestion = "Tax ID already exists";
//         }
//         return next(
//           new ValidationError("Company already exists", {
//             statusCode: 409,
//             errorCode: "DUPLICATE_COMPANY",
//             suggestion,
//           })
//         );
//       }

//       // 4. Create company with proper error handling
//       let newCompany;
//       try {
//         newCompany = await Company.create(
//           [
//             {
//               // Required fields
//               companyName: companyData.companyName,
//               legalName: companyData.legalName,
//               companyType: companyData.companyType,
//               taxIdentificationNumber: companyData.taxIdentificationNumber,
//               identityDocuments: {
//                 panNumber: companyData.identityDocuments.panNumber,
//               },
//               primaryEmail: companyData.primaryEmail,
//               primaryPhone: companyData.primaryPhone,
//               operationalAddress: {
//                 district: companyData.operationalAddress.district,
//                 province: companyData.operationalAddress.province,
//                 zip: companyData.operationalAddress.zip,
//                 country: companyData.operationalAddress.country || "Nepal",
//               },

//               // Optional fields with null checks
//               ...(companyData.secondaryPhone && {
//                 secondaryPhone: companyData.secondaryPhone,
//               }),
//               ...(companyData.emergencyContact && {
//                 emergencyContact: companyData.emergencyContact,
//               }),
//               ...(companyData.warehouseLocations && {
//                 warehouseLocations: companyData.warehouseLocations,
//               }),
//               ...(companyData.bankDetails && {
//                 bankDetails: companyData.bankDetails,
//               }),
//               ...(companyData.paymentMethods && {
//                 paymentMethods: companyData.paymentMethods,
//               }),

//               // System fields
//               createdBy: (user as any)._id as mongoose.Types.ObjectId,
//               isActive: true,
//               verificationStatus: "pending",
//             },
//           ],
//           { session }
//         );
//       } catch (createError) {
//         console.error("Company creation failed:", createError);
//         throw new DatabaseError("Failed to create company record", {
//           statusCode: 500,
//           errorCode: "COMPANY_CREATION_FAILED",
//           originalError: createError,
//         });
//       }

//       // 5. Create activity log
//       try {
//         await ActivityLog.create(
//           [
//             {
//               action: "CREATE",
//               entity: "Company",
//               entityId: newCompany[0]._id,
//               performedBy: (user as any)._id as mongoose.Types.ObjectId,
//               performedByModel: "BusinessUser",
//               metadata: {
//                 companyName: newCompany[0].companyName,
//               },
//             },
//           ],
//           { session }
//         );
//       } catch (logError) {
//         console.error("Activity log creation failed:", logError);
//         throw new DatabaseError("Failed to create activity log", {
//           statusCode: 500,
//           errorCode: "LOG_CREATION_FAILED",
//           originalError: logError,
//         });
//       }

//       await session.commitTransaction();

//       // 6. Prepare response
//       const response = newCompany[0].toObject();
//       const { identityDocuments, bankDetails, __v, ...responseData } = response;

//       res.status(201).json({
//         status: "success",
//         message: "Company registered successfully",
//         data: responseData,
//       });
//     } catch (error) {
//       await session.abortTransaction();

//       // Handle known error types
//       if (error instanceof DatabaseError || error instanceof ValidationError) {
//         return next(error);
//       }

//       // Fallback for unexpected errors
//       console.error("Unexpected registration error:", error);
//       next(
//         new DatabaseError("Company registration failed", {
//           statusCode: 500,
//           errorCode: "REGISTRATION_FAILED",
//           originalError: error,
//         })
//       );
//     } finally {
//       session.endSession();
//     }
//   }
// );
