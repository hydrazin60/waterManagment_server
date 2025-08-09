import { Company } from '../../../../../db/model/company/companyData.model';
import { catchAsync } from "../../../../../packages/error_handler/error_middleware";
import { NextFunction, Request, Response } from "express";
import { DatabaseError } from "../../../../../packages/error_handler";
import { CompanyOwnerFinder } from '../../utils/companYHelper';
import { Admin } from "../../../../../db/model/user/admin/Admin.model";
import { BusinessUser } from "../../../../../db/model/user/BusinessUser/BusinessUser.model";

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
