import e from "express";
import { RegisterNewCompany } from "../controllers/company.controller";
import { isAuthenticated } from "../../../../packages/middleware/isAuthenticated";
const companyRouter = e.Router();
 companyRouter.post("/register-company" , isAuthenticated ,RegisterNewCompany)
export default companyRouter;