import mongoose, { Document, Schema, Types } from "mongoose";

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

export interface IBusinessUser extends Document {
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
  permanentAddress: IAddress;
  temporaryAddress?: IAddress;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  bankDetails?: IBankDetails;
  identityDocuments?: IIdentityDocuments;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  chatSettings: IChatSettings;
  companies: Types.ObjectId[];
  roleInCompany: "owner" | "manager" | "ceo" | "cbo" | "HR" | "director";
  department?: string;
  position?: string;
  isPrimaryContact: boolean;
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>({
  district: { type: String, required: true },
  city: { type: String },
  tole: { type: String },
  nearFamousPlace: { type: String },
  country: { type: String, default: "Nepal" },
  province: { type: String, required: true },
  zip: { type: String, required: true },
  coordinates: { type: [Number] },
});

const BankDetailsSchema = new Schema<IBankDetails>({
  accountNumber: { type: String, required: true },
  bankName: { type: String, required: true },
  branchName: { type: String, required: true },
  accountHolderName: { type: String, required: true },
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

const BusinessUserSchema = new Schema<IBusinessUser>(
  {
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
    permanentAddress: { type: AddressSchema, required: true },
    temporaryAddress: { type: AddressSchema },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    bankDetails: { type: BankDetailsSchema },
    identityDocuments: { type: IdentityDocumentsSchema },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
    chatSettings: { type: ChatSettingsSchema, default: () => ({}) },
    companies: [{ type: Types.ObjectId, ref: "Company" }],
    roleInCompany: {
      type: String,
      required: true,
      enum: ["owner", "manager", "ceo", "cbo", "HR", "director"],
    },
    department: { type: String },
    position: { type: String },
    isPrimaryContact: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String },
  },
  { timestamps: true }
);

BusinessUserSchema.index({ companies: 1 });
BusinessUserSchema.index({ roleInCompany: 1 });
BusinessUserSchema.index({ isActive: 1, isSuspended: 1 });

export const BusinessUser = mongoose.model<IBusinessUser>(
  "BusinessUser",
  BusinessUserSchema
);
