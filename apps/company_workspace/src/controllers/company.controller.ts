import { catchAsync } from "../../../../packages/error_handler/error_middleware";
import { NextFunction, Request, Response } from "express";
import { validateBusinessUser } from "../utils/validateUser";
import {
  DatabaseError,
  ValidationError,
} from "../../../../packages/error_handler";
import { createCompanySchema } from "../helper/company.validation";
import { Company } from "../../../../db/model/company/companyData.model";
import { ActivityLog } from "../../../../db/model/activityLog/activityLog.model";

export const registerCompany = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auther = await validateBusinessUser(req.user, next);
      if (!auther || !auther.user || !auther.user._id) {
        return next(
          new DatabaseError("User not found or unauthorized", {
            statusCode: 401,
            errorCode: "UNAUTHORIZED",
          })
        );
      }

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
        owners: [auther.user._id],
        ownerModel:
          auther.user.accountType === "admin" ? "Admin" : "BusinessUser",
        createdBy: auther.user._id,
      });
      // 5. Create activity log
      await ActivityLog.create({
        action: "CREATE",
        entity: "Company",
        entityId: newCompany._id,
        performedBy: auther.user._id,
        performedByModel:
          auther.user.accountType === "admin" ? "Admin" : "BusinessUser",
        metadata: {
          companyName: newCompany.companyName,
          companyType: newCompany.companyType,
        },
        timestamp: new Date(),
      });
      const responseData = newCompany.toObject();
      const { identityDocuments, bankDetails, __v, ...safeResponseData } =
        responseData;
      auther.user.companies = auther.user.companies || [];
      auther.user.companies.push((newCompany as any)._id);
      await auther.user.save();

      res.status(201).json({
        status: "success",
        message: "Company registered successfully and pending verification",
        data: safeResponseData,
      });
    } catch (error) {
        console.log(error);
      return next(
        new DatabaseError("Internal server error", {
          statusCode: 500,
          errorCode: "SERVER_ERROR",
        })
      );
    }
  }
);
