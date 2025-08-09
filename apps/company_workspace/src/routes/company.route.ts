import e from "express";

import { isAuthenticated } from "../../../../packages/middleware/isAuthenticated";
import { fetchSingleCompanyBYOwner } from "../controllers/owner/company.controller";
import { registerCompany } from "../controllers/company.controller";
const companyRouter = e.Router();

companyRouter.post("/register-company", isAuthenticated, registerCompany);

companyRouter.get(
  "/fetch/your_Company/data/:companyId",
  isAuthenticated,
  fetchSingleCompanyBYOwner
);
export default companyRouter;
