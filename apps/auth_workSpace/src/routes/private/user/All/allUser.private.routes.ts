import e from "express";
import { isAuthenticated } from "../../../../../../../packages/middleware/isAuthenticated";
import {
  GetOwnProfile,
  LogOut,
} from "../../../../controllers/All/private/allUser.private.controller";

const allUserPrivateRouter = e.Router();
allUserPrivateRouter.get("/logout", isAuthenticated, LogOut);
allUserPrivateRouter.get("/u/profile", isAuthenticated, GetOwnProfile);
export default allUserPrivateRouter;
