import express from "express";
import { adminRegistration } from "../../controllers/Admin/Admin.auth.controller";
const AdminAuthRouter = express.Router();
AdminAuthRouter.post("/register", adminRegistration);

export default AdminAuthRouter;
