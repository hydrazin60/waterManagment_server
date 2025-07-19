import { Admin } from "../../../../../db/model/user/admin/Admin.model";
import { BusinessUser } from "../../../../../db/model/user/BusinessUser/BusinessUser.model";
import CustomerUser from "../../../../../db/model/user/customer/CustomerUser.model";

const findUserById = async (userId: string) => {
  let user = await Admin.findById(userId);
  if (user) return { user, userType: "admin" };
  user = await BusinessUser.findById(userId);
  if (user) return { user, userType: "business" };
  user = await CustomerUser.findById(userId);
  if (user) return { user, userType: "customer" };
  return null;
};

module.exports = findUserById;
