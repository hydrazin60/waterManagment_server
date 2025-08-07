import { Admin } from "../../../../../db/model/user/admin/Admin.model";
import { BusinessUser } from "../../../../../db/model/user/BusinessUser/BusinessUser.model";
import CustomerUser from "../../../../../db/model/user/customer/CustomerUser.model";
import { Staff } from "../../../../../db/model/user/staff/staff.schema";
import { ValidationError } from "../../../../../packages/error_handler";
import {
  LeanIAdminUser,
  LeanIBusinessUser,
  LeanICustomerUser,
  LeanIStaff,
  LeanIUser,
} from "../interfaces/IUserBase";
// utils/auth/login.helper.ts

interface LoginData {
  email?: string;
  password?: string;
}

export const validateLoginData = (
  data: Partial<LoginData> = {}
): { valid: boolean; error?: ValidationError } => {
  const { email = "", password = "" } = data;
  if (!email.trim()) {
    return { valid: false, error: new ValidationError("Email is required") };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: new ValidationError("Invalid email format") };
  }
  if (!password.trim()) {
    return { valid: false, error: new ValidationError("Password is required") };
  }
  return { valid: true };
};

export const findUserByEmail = async (
  email: string
): Promise<LeanIUser | null> => {
  const [businessUser, customerUser, staff, admin] = await Promise.all([
    BusinessUser.findOne({ email })
      .select("+password")
      .lean<LeanIBusinessUser>(),
    CustomerUser.findOne({ email })
      .select("+password")
      .lean<LeanICustomerUser>(),
    Staff.findOne({ email }).select("+password").lean<LeanIStaff>(),
    Admin.findOne({ email }).select("+password").lean<LeanIAdminUser>(),
  ]);
  return businessUser || customerUser || staff || admin || null;
};

export const getUserModelName = (user: LeanIUser): string => {
  if (user.accountType) {
    return user.accountType.toLowerCase();
  }
  // Then check business roles
  if (
    user.roleInCompany &&
    ["owner", "manager", "ceo", "cbo", "HR", "director"].includes(
      user.roleInCompany
    )
  ) {
    return "business";
  }
  // Check customer type
  if (user.customerType) {
    return "customer";
  }

  // Check admin roles
  if (
    user.roleInCompany &&
    ["superadmin", "admin", "moderator", "support", "developer"].includes(
      user.roleInCompany
    )
  ) {
    return "admin";
  }

  // Default fallback
  return "staff";
};
export const getUserRoleSpecificData = (user: LeanIUser) => {
  const commonFields = {
    _id: user._id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    userType: getUserModelName(user),
  };

  if ("customerType" in user) {
    return {
      ...commonFields,
      customerType: user.customerType,
    };
  }

  if ("roleInCompany" in user) {
    return {
      ...commonFields,
      roleInCompany: user.roleInCompany,
    };
  }

  return commonFields;
};
