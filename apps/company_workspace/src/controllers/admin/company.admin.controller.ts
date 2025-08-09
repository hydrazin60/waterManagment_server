import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../../../../packages/error_handler/error_middleware";
import { AdminUserFinder } from "../../utils/companYHelper";
import { AuthError } from "../../../../../packages/error_handler";
import { Company } from "../../../../../db/model/company/companyData.model";

export const fetchAllCompanyList = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const admin = await AdminUserFinder(req.user, next);
        if (!admin) {
            return next(new AuthError("You are not authorized", { statusCode: 401, errorCode: "UNAUTHORIZED" }));
        }

        const fieldsToSelect = [
            "companyName",
            "legalName",
            "companyType",
            "industry",
            "companyLogo",
            "companyWebsite",
            "companyDescription",
            "foundingDate",
            "owners",
            "ownerModel",
            "identityDocuments",
            "primaryEmail",
            "primaryPhone",
            "secondaryPhone",
            "emergencyContact",
            "operationalAddress",
            "warehouseLocations",
            "bankDetails",
            "operatingHours",
            "deliveryRadius",
            "verificationStatus",
            "verificationNotes",
            "isActive",
            "isPremium",
            "createdAt",
            "updatedAt",
            "createdBy",
            "deliveryFee",
            "serviceAreas",
            "isVerified",
        ].join(" ");

        const companies = await Company.find()
            .select(fieldsToSelect)
            .populate("owners", "name email phone")
            .populate("createdBy", "name email phone");

        return res.status(200).json({
            status: "success",
            message: "Company details fetched successfully",
            data: companies,
        });
    }
);
