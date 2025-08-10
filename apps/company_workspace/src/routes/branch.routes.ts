import e from "express";
import { isAuthenticated } from "../../../../packages/middleware/isAuthenticated";
import { registerABranch } from "../controllers/owner/company.owner.controller";
const branchRouter = e.Router();
branchRouter.post("/register-branch/:companyId", isAuthenticated, registerABranch)

export default branchRouter;