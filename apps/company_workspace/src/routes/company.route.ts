import e from "express";

import { isAuthenticated } from "../../../../packages/middleware/isAuthenticated";
import { fetchSingleCompanyBYOwner } from "../controllers/ownerandAdmin/company.controller";
import { registerCompany } from "../controllers/company.controller";
import { fetchAllCompanyList } from "../controllers/admin/company.admin.controller";
import { DeleteCompany, EditCompanyData } from "../controllers/owner/company.owner.controller";
const companyRouter = e.Router();
// admin and owner
companyRouter.post("/register-company", isAuthenticated, registerCompany);
companyRouter.get(
  "/fetch/your_Company/data/:companyId",
  isAuthenticated,
  fetchSingleCompanyBYOwner
);

// only owner
companyRouter.delete("/delete/company/:companyId", isAuthenticated, DeleteCompany);
companyRouter.patch("/edit/company/:companyId", isAuthenticated, EditCompanyData);
// only Admin
companyRouter.get("/fetch/all_company/list", isAuthenticated, fetchAllCompanyList)
//  staff and manager
export default companyRouter;
