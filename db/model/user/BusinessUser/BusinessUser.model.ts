import mongoose, { Document, Schema, Types } from "mongoose";

// ====================== COMMON INTERFACES ======================
interface IAddress {
  district: string;
  city?: string;
  tole?: string;
  nearFamousPlace?: string;
  country: string;
  province: string;
  zip: string;
  coordinates?: [number, number];
}

interface IBankDetails {
  accountNumber: string;
  bankName: string;
  branchName: string;
  accountHolderName: string;
  bankQRCode?: string;
  eSewaID?: string;
  eSewaQRCode?: string;
  khaltiID?: string;
  khaltiQRCode?: string;
}

interface IIdentityDocuments {
  citizenshipNumber?: string;
  citizenshipPhoto?: string;
  drivingLicenseNumber?: string;
  nationalIdNumber?: string;
  passportNumber?: string;
  panNumber?: string;
  panPhoto?: string;
}

interface IChatSettings {
  notificationsEnabled: boolean;
  messagePreview: boolean;
  onlineStatusVisible: boolean;
}

// ====================== BUSINESS USER SCHEMA ======================
export interface IBusinessUser extends Document {
  // Personal Info
  name: string;
  email: string;
  password: string;
  phone: string;
  profileImage?: string;
  accountType: "business";
  gender?: "male" | "female" | "other" | "prefer-not-to-say";
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  // Addresses
  permanentAddress: IAddress;
  temporaryAddress?: IAddress;

  // Authentication & Security
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;

  // Documents
  bankDetails?: IBankDetails;
  identityDocuments?: IIdentityDocuments;

  // User Settings
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  chatSettings: IChatSettings;
  // Company Association
  company?: Types.ObjectId;
  roleInCompany: "owner" | "manager" | "ceo" | "cbo" | "HR" | "director";
  department?: string;
  position?: string;
  isPrimaryContact: boolean;

  // Status
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ====================== SUB-SCHEMAS ======================
const AddressSchema = new Schema<IAddress>({
  district: { type: String },
  city: { type: String },
  tole: { type: String },
  nearFamousPlace: { type: String },
  country: { type: String, default: "Nepal" },
  province: { type: String },
  zip: { type: String },
  coordinates: { type: [Number] },
});

const BankDetailsSchema = new Schema<IBankDetails>({
  accountNumber: { type: String },
  bankName: { type: String },
  branchName: { type: String },
  accountHolderName: { type: String },
  bankQRCode: { type: String },
  eSewaID: { type: String },
  eSewaQRCode: { type: String },
  khaltiID: { type: String },
  khaltiQRCode: { type: String },
});

const IdentityDocumentsSchema = new Schema<IIdentityDocuments>({
  citizenshipNumber: { type: String },
  citizenshipPhoto: { type: String },
  drivingLicenseNumber: { type: String },
  nationalIdNumber: { type: String },
  passportNumber: { type: String },
  panNumber: { type: String },
  panPhoto: { type: String },
});

const ChatSettingsSchema = new Schema<IChatSettings>({
  notificationsEnabled: { type: Boolean, default: true },
  messagePreview: { type: Boolean, default: true },
  onlineStatusVisible: { type: Boolean, default: true },
});

// ====================== MAIN SCHEMA ======================
const BusinessUserSchema = new Schema<IBusinessUser>(
  {
    // Personal Info
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    accountType: { type: String, default: "business" },
    profileImage: { type: String },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer-not-to-say"],
    },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },
    // Addresses
    permanentAddress: { type: AddressSchema },
    temporaryAddress: { type: AddressSchema },

    // Authentication & Security
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },

    // Documents
    bankDetails: { type: BankDetailsSchema },
    identityDocuments: { type: IdentityDocumentsSchema },

    // User Settings
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
    chatSettings: { type: ChatSettingsSchema, default: () => ({}) },

    // Company Association
    company: { type: Schema.Types.ObjectId, ref: "Company", required: false },

    roleInCompany: {
      type: String,
      required: true,
      enum: ["owner", "manager", "ceo", "cbo", "HR", "director"],
    },
    department: { type: String },
    position: { type: String },
    isPrimaryContact: { type: Boolean, default: false },

    // Status
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String },
  },
  { timestamps: true }
);

// ====================== INDEXES ======================

BusinessUserSchema.index({ "temporaryAddress.district": 1 });
BusinessUserSchema.index({ "permanentAddress.district": 1 });
BusinessUserSchema.index({ roleInCompany: 1 });
BusinessUserSchema.index({ isActive: 1, isSuspended: 1 });

// ====================== MODEL ======================
export const BusinessUser = mongoose.model<IBusinessUser>(
  "BusinessUser",
  BusinessUserSchema
);
