import e from "express";
import { isAuthenticated } from "../../../../../../../packages/middleware/isAuthenticated";
import { LogOut } from "../../../../controllers/All/allUser.controller";

const allUserPrivateRouter = e.Router();
allUserPrivateRouter.get("/logout", isAuthenticated, LogOut);
export default allUserPrivateRouter;
