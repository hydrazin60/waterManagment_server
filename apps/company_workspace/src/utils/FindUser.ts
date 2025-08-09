import { Model, Document, Types } from "mongoose";
import { Admin } from "../../../../db/model/user/admin/Admin.model";
import { BusinessUser } from "../../../../db/model/user/BusinessUser/BusinessUser.model";
import { Staff } from "../../../../db/model/user/staff/staff.schema";

type UserType = "admin" | "businessUser" | "staff" | "customer";

interface IUserResult<T> {
  user: T;
  userType: UserType;
}

export async function findUserByType(
  userId: Types.ObjectId,
  accountType: UserType
): Promise<IUserResult<any>> {
  let userModel: Model<any & Document>;

  switch (accountType) {
    case "admin":
      userModel = Admin;
      break;
    case "businessUser":
      userModel = BusinessUser;
      break;
    case "staff":
      userModel = Staff;
      break;
    default:
      throw new Error("Invalid user type specified");
  }

  const user = await userModel.findById(userId);
  if (!user) {
    throw new Error(`User not found in ${accountType} model`);
  }

  return { user, userType: accountType };
}
