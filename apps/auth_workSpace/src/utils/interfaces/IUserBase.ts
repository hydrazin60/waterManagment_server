// interfaces/IUserBase.ts
import { Document } from "mongoose";

// Helper to simulate LeanDocument
type LeanDocument<T> = Omit<T, keyof Document>;

// Base interface with all common fields
export interface IUserBase extends Document {
  _id: string;
  email: string;
  password: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  matchPassword?(enteredPassword: string): Promise<boolean>;
}

// Extended interfaces for each user type
export interface ICustomerUser extends IUserBase {
  customerType: "new" | "occasional" | "regular" | "loyal";
  roleInCompany?: never;
}

export interface IBusinessUser extends IUserBase {
  roleInCompany: "owner" | "manager" | "ceo" | "cbo" | "HR" | "director";
  customerType?: never;
}

export interface IStaff extends IUserBase {
  roleInCompany:
    | "manager"
    | "ceo"
    | "cbo"
    | "HR"
    | "director"
    | "accountent"
    | "cleaner"
    | "driver"
    | "marketer"
    | "factoryWorker"
    | "warehouseWorker"
    | "helper";
  customerType?: never;
}

export interface IAdminUser extends IUserBase {
  roleInCompany: "superadmin" | "admin" | "moderator" | "support" | "developer";
  customerType?: never;
}

// Lean versions with all fields
export type LeanICustomerUser = {
  _id: string;
  email: string;
  password: string;
  role?: string;
  accountType: string;
  createdAt: Date;
  updatedAt: Date;
  customerType: "new" | "occasional" | "regular" | "loyal";
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
} & LeanDocument<ICustomerUser>;

export type LeanIBusinessUser = {
  _id: string;
  email: string;
  password: string;
  role?: string;
  accountType: string;
  createdAt: Date;
  updatedAt: Date;
  roleInCompany: "owner" | "manager" | "ceo" | "cbo" | "HR" | "director";
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
} & LeanDocument<IBusinessUser>;

export type LeanIStaff = {
  _id: string;
  email: string;
  password: string;
  role?: string;
  accountType: string;
  createdAt: Date;
  updatedAt: Date;
  roleInCompany:
    | "manager"
    | "ceo"
    | "cbo"
    | "HR"
    | "director"
    | "accountent"
    | "cleaner"
    | "driver"
    | "marketer"
    | "factoryWorker"
    | "warehouseWorker"
    | "helper";
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
} & LeanDocument<IStaff>;

export type LeanIAdminUser = {
  _id: string;
  email: string;
  password: string;
  accountType: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
  roleInCompany: "superadmin" | "admin" | "moderator" | "support" | "developer";
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
} & LeanDocument<IAdminUser>;

export type LeanIUser =
  | LeanICustomerUser
  | LeanIBusinessUser
  | LeanIStaff
  | LeanIAdminUser;
