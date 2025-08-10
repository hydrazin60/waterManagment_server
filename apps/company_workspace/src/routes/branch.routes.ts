import e from "express";
import { isAuthenticated } from "../../../../packages/middleware/isAuthenticated";
import { registerABranch } from "../controllers/owner/company.owner.controller";
import { fetchBranchListOfoneCompany, fetchOneBranchData } from "../controllers/ownerandAdmin/company.controller";
const branchRouter = e.Router();
// only owner
branchRouter.post("/register-branch/:companyId", isAuthenticated, registerABranch)
// owner and admin
branchRouter.get("/fetch/branch-list/:companyId", isAuthenticated, fetchBranchListOfoneCompany)
branchRouter.get("/fetch/one/branch-data/:branchId", isAuthenticated, fetchOneBranchData)
export default branchRouter;