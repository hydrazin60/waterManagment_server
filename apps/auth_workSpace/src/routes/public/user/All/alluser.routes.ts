import e from "express";
import { login } from "../../../../controllers/All/allUser.controller";

const allUserRouter = e.Router();
allUserRouter.post("/login", login);
export default allUserRouter;