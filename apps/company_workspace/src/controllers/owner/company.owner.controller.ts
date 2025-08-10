import { Company, ICompany } from '../../../../../db/model/company/companyData.model';
import { catchAsync } from "../../../../../packages/error_handler/error_middleware";
import { NextFunction, Request, Response } from "express";
import { AppError, DatabaseError, ValidationError } from "../../../../../packages/error_handler";
import { CompanyOwnerFinder, findUserByType } from '../../utils/companYHelper';
import { Admin } from "../../../../../db/model/user/admin/Admin.model";
import { BusinessUser } from "../../../../../db/model/user/BusinessUser/BusinessUser.model";
import mongoose from 'mongoose';
import { Branch } from '../../../../../db/model/Branch/branch.model';
import { ActivityLog } from '../../../../../db/model/activityLog/activityLog.model';
import { validateBranchData } from '../../helper/branch.validation';
type UserType = "admin" | "business" | "staff" | "customer";

export const DeleteCompany = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Verify ownership and get company document
    const company = await CompanyOwnerFinder(req.user, req.params.companyId, next);
    if (!company) return; // error handled inside CompanyOwnerFinder
    // Delete company
    const deletedCompany = await Company.findByIdAndDelete(req.params.companyId);
    if (!deletedCompany) {
        return next(new DatabaseError("Failed to delete company", {
            statusCode: 500,
            errorCode: "DELETE_FAILED",
        }));
    }
    const owners = company.owners as any[];
    // Map to ownerModel keys
    const ownersByModel: Record<string, string[]> = {
        Admin: [],
        BusinessUser: []
    };

    owners.forEach(owner => {
        ownersByModel[company.ownerModel]?.push(owner._id.toString());
    });

    // Remove company ref from Admin users
    if (ownersByModel.Admin.length > 0) {
        await Admin.updateMany(
            { _id: { $in: ownersByModel.Admin } },
            { $pull: { companies: company._id } }
        );
    }

    // Remove company ref from BusinessUser users
    if (ownersByModel.BusinessUser.length > 0) {
        await BusinessUser.updateMany(
            { _id: { $in: ownersByModel.BusinessUser } },
            { $pull: { companies: company._id } }
        );
    }

    return res.status(200).json({
        success: true,
        message: "Company deleted successfully",
        data: { deletedCompanyId: deletedCompany._id }
    });
});



export const EditCompanyData = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const editableFields: (keyof ICompany)[] = [
            "companyName",
            "companyType",
            "industry",
            "companyLogo",
            "companyWebsite",
            "companyDescription",
            "primaryEmail",
            "primaryPhone",
            "secondaryPhone",
            "emergencyContact",
            "operationalAddress",
            "warehouseLocations",
            "bankDetails",
            "paymentMethods",
            "operatingHours",
            "deliveryRadius",
            "deliveryFee",
            "serviceAreas",
            "isActive",
        ];

        // 1. Verify ownership and get the company document
        const company = await CompanyOwnerFinder(req.user, req.params.companyId, next);
        if (!company) return; // Error handled inside CompanyOwnerFinder

        // 2. Prepare update object by filtering req.body to only allow editable fields
        const updates: Partial<ICompany> = {};

        for (const key of editableFields) {
            if (req.body.hasOwnProperty(key)) {
                updates[key] = req.body[key];
            }
        }
        // 3. Optionally: Validate updates here or rely on Mongoose validators
        if (Object.keys(updates).length === 0) {
            return next(
                new ValidationError("No valid fields provided for update", {
                    statusCode: 400,
                    errorCode: "NO_UPDATE_FIELDS",
                })
            );
        }
        // 4. Perform atomic update with validation and return updated document
        const updatedCompany = await Company.findByIdAndUpdate(
            company._id,
            updates,
            { new: true, runValidators: true }
        );
        if (!updatedCompany) {
            return next(
                new ValidationError("Failed to update company", {
                    statusCode: 500,
                    errorCode: "UPDATE_FAILED",
                })
            );
        }
        // 5. Send success response with updated company
        return res.status(200).json({
            status: "success",
            message: "Company updated successfully",
            data: updatedCompany,
        });
    }
);

export const registerABranch = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // 1) Verify company ownership and populate basic info
    const company = await CompanyOwnerFinder(req.user, req.params.companyId, next);
    if (!company) return;

    // 2) Verify and get user details
    if (!req.user?.id || !req.user?.type) {
        return next(new AppError("Missing user ID or type", 400));
    }

    const user = await findUserByType(
        new mongoose.Types.ObjectId(req.user.id),
        req.user.type as UserType
    )

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    // 3) Generate branch code
    const branchCode = generateBranchCode(
        company.companyName,
        req.body.branchName
    );
    const validation = validateBranchData(req.body);
    if (!validation.success) {
        return next(new ValidationError("Invalid branch data", { statusCode: 400, errorCode: "INVALID_BRANCH_DATA" }));
    }
    // 4) Create branch with populated references
    const branchData = {
        ...req.body,
        company: company._id,
        createdBy: user.user._id,
        branchCode: branchCode
    };

    const branch = await Branch.create(branchData);

    // 5) Update company's branches array
    await Company.findByIdAndUpdate(
        company._id,
        { $push: { branches: branch._id } },
        { new: true }
    );

    // 6) Create activity log
    await ActivityLog.create({
        action: "CREATE",
        entity: "Branch",
        entityId: branch._id,
        performedBy: user.user._id,
        performedByModel: "BusinessUser",
        metadata: {
            branchName: branch.branchName,
            branchCode: branch.branchCode,
            companyName: company.companyName
        }
    });

    // 7) Populate response data
    const populatedBranch = await Branch.findById(branch._id)
        .populate({
            path: 'company',
            select: 'companyName'
        })
        .populate({
            path: 'createdBy',
            select: 'name email phone'
        });

    // 8) Send response
    res.status(201).json({
        status: "success",
        message: "Branch registered successfully",
        data: populatedBranch
    });
});
// Helper function to generate branch code
function generateBranchCode(companyName: string, branchName: string): string {
    const companyPrefix = companyName
        .substring(0, 2)
        .toUpperCase()
        .replace(/\s/g, '');

    const branchPrefix = branchName
        .substring(0, 2)
        .toUpperCase()
        .replace(/\s/g, '');

    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    return `${companyPrefix}-${branchPrefix}-${year}${month}${day}`;
}