import mongoose, { Document, Schema, Types } from "mongoose";

// ---------------- Interfaces ----------------
interface IAdminAccess {
  dashboard: boolean;
  userManagement: boolean;
  businessApproval: boolean;
  contentModeration: boolean;
  analytics: boolean;
  settings: boolean;
  supportTickets: boolean;
  productManagement: boolean;
  orderManagement: boolean;
  paymentManagement: boolean;
}

interface IAddress {
  district?: string;
  municipality?: string;
  city?: string;
  tole?: string;
  nearFamousPlace?: string;
  country?: string;
  province?: string;
  coordinates?: [number, number];
}

interface IBankDetails {
  AccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  bankQRCode?: string;
  e_SewaID?: string;
  e_SewaQRCode?: string;
  khaltiID?: string;
  khaltiQRCode?: string;
}

interface IIdentityDocument {
  NationalID?: string;
  NationalIDPhoto?: string;
  passportNumber?: string;
  passportImage?: string;
  License?: string;
  LicensePhoto?: string;
  citizenShipNumber?: string;
  citizenShipPhoto?: [string];
}

interface IEmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  accountType: "admin";
  role: "superadmin" | "admin" | "moderator" | "support" | "developer";
  permanentAddress: IAddress;
  temporaryAddress?: IAddress;
  identityDocument?: IIdentityDocument;
  bankDetails?: IBankDetails;
  chats?: Types.ObjectId[];
  isActive: boolean;
  lastLogin?: Date;
  lastLogout?: Date;
  loginIP?: string;
  permissions: IAdminAccess;
  twoFactorEnabled: boolean;
  profileImage?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdBy?: Types.ObjectId;
  emergencyContact: IEmergencyContact;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------- Schemas ----------------
const AdminAccessSchema = new Schema<IAdminAccess>({
  dashboard: { type: Boolean, default: true },
  userManagement: { type: Boolean, default: false },
  businessApproval: { type: Boolean, default: false },
  contentModeration: { type: Boolean, default: false },
  analytics: { type: Boolean, default: false },
  settings: { type: Boolean, default: false },
  supportTickets: { type: Boolean, default: false },
  productManagement: { type: Boolean, default: false },
  orderManagement: { type: Boolean, default: false },
  paymentManagement: { type: Boolean, default: false },
});

const IdentityDocumentSchema = new Schema<IIdentityDocument>({
  NationalID: { type: String, unique: true, sparse: true },
  NationalIDPhoto: { type: String },
  passportNumber: { type: String, unique: true, sparse: true },
  passportImage: { type: String },
  License: { type: String, unique: true, sparse: true },
  LicensePhoto: { type: String },
  citizenShipNumber: { type: String, unique: true, sparse: true },
  citizenShipPhoto: { type: [String] },
});

const AddressSchema = new Schema<IAddress>({
  district: { type: String },
  municipality: { type: String },
  city: { type: String },
  tole: { type: String },
  nearFamousPlace: { type: String },
  country: { type: String, default: "Nepal" },
  province: { type: String },
  coordinates: {
    type: [Number],
    // validate: {
    //   validator: (v: number[]) =>
    //     v.length === 2 &&
    //     v[0] >= -180 &&
    //     v[0] <= 180 &&
    //     v[1] >= -90 &&
    //     v[1] <= 90,
    //   message: "Invalid coordinates [longitude, latitude].",
    // },
  },
});

const EmergencyContactSchema = new Schema<IEmergencyContact>({
  name: { type: String },
  phone: { type: String },
  relation: { type: String },
});

const BankDetailsSchema = new Schema<IBankDetails>({
  AccountNumber: { type: String, required: true }, // Example: Made required
  bankName: { type: String, required: true },
  bankBranch: { type: String },
  bankQRCode: { type: String },
  e_SewaID: { type: String },
  e_SewaQRCode: { type: String },
  khaltiID: { type: String },
  khaltiQRCode: { type: String },
});

// ---------------- Admin Schema ----------------
const AdminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    accountType: { type: String, enum: ["admin"], default: "admin" },
    role: {
      type: String,
      required: true,
      enum: ["superadmin", "admin", "moderator", "support", "developer"],
      default: "admin",
    },
    permanentAddress: { type: AddressSchema, required: true },
    temporaryAddress: { type: AddressSchema },
    identityDocument: { type: IdentityDocumentSchema },
    bankDetails: { type: BankDetailsSchema },
    chats: [{ type: Types.ObjectId, ref: "Chat" }],
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    lastLogout: { type: Date },
    loginIP: { type: String },
    permissions: { type: AdminAccessSchema, default: () => ({}) },
    twoFactorEnabled: { type: Boolean, default: false },
    profileImage: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    createdBy: { type: Types.ObjectId, ref: "Admin" },
    emergencyContact: { type: EmergencyContactSchema },
  },
  { timestamps: true }
);

AdminSchema.index({ createdAt: -1 });

export const Admin = mongoose.model<IAdmin>("Admin", AdminSchema);
