import mongoose, { Document, Schema, Types } from "mongoose";

// ====================== COMMON INTERFACES ======================
interface IAddress {
  district: string;
  municipality?: string;
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
  panNumber?: string;
  panPhoto?: string;
  businessRegistrationCertificate?: string;
  taxClearanceCertificate?: string;
}

interface IContactPerson {
  name: string;
  position: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

// ====================== BUSINESS USER SCHEMA ======================
export interface IBusinessUser extends Document {
  // Basic Info
  name: string;
  email: string;
  password: string;
  phone: string;
  profileImage?: string;

  // Business Info
  role: "retailer" | "distributor" | "manufacturer" | "wholesaler";
  businessName: string;
  businessRegistrationNumber: string;
  businessType: string;
  taxIdentificationNumber?: string;
  businessDescription?: string;
  businessLogo?: string;
  businessWebsite?: string;

  // Addresses
  permanentAddress: IAddress;
  temporaryAddress?: IAddress;
  businessAddress: IAddress;
  warehouseAddresses?: IAddress[];

  // Documents
  bankDetails: IBankDetails;
  identityDocuments: IIdentityDocuments;

  // Business Operations
  businessVerified: boolean;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  verificationNotes?: string;
  isActive: boolean;
  isPremium: boolean;

  // References
  products?: Types.ObjectId[];
  warehouses?: Types.ObjectId[];
  orders?: Types.ObjectId[];
  contactPersons: IContactPerson[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Security
  lastLogin?: Date;
  loginIP?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
}

// ====================== SUB-SCHEMAS ======================
const AddressSchema = new Schema<IAddress>({
  district: { type: String, required: true },
  municipality: { type: String },
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
  panNumber: { type: String },
  panPhoto: { type: String },
  businessRegistrationCertificate: { type: String },
  taxClearanceCertificate: { type: String },
});

const ContactPersonSchema = new Schema<IContactPerson>({
  name: { type: String, required: true },
  position: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  isPrimary: { type: Boolean, default: false },
});

// ====================== MAIN SCHEMA ======================
const BusinessUserSchema = new Schema<IBusinessUser>(
  {
    // Basic Info
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    profileImage: { type: String },

    // Business Info
    role: {
      type: String,
      required: true,
      enum: ["retailer", "distributor", "manufacturer", "wholesaler"],
    },
    businessName: { type: String, required: true },
    businessRegistrationNumber: { type: String, required: true },
    businessType: { type: String, required: true },
    taxIdentificationNumber: { type: String },
    businessDescription: { type: String },
    businessLogo: { type: String },
    businessWebsite: { type: String },

    // Addresses
    permanentAddress: { type: AddressSchema, required: true },
    temporaryAddress: { type: AddressSchema },
    businessAddress: { type: AddressSchema, required: true },
    warehouseAddresses: [AddressSchema],

    // Documents
    bankDetails: { type: BankDetailsSchema, required: true },
    identityDocuments: { type: IdentityDocumentsSchema, required: true },

    // Business Operations
    businessVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    verificationNotes: { type: String },
    isActive: { type: Boolean, default: true },
    isPremium: { type: Boolean, default: false },

    // References
    products: [{ type: Types.ObjectId, ref: "Product" }],
    warehouses: [{ type: Types.ObjectId, ref: "Warehouse" }],
    orders: [{ type: Types.ObjectId, ref: "Order" }],
    contactPersons: { type: [ContactPersonSchema], default: [] },

    // Security
    lastLogin: { type: Date },
    loginIP: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true }
);

// ====================== INDEXES ======================
BusinessUserSchema.index({ email: 1, phone: 1, role: 1 });
BusinessUserSchema.index({ businessName: "text" });
BusinessUserSchema.index({ "businessAddress.district": 1 });
BusinessUserSchema.index({ verificationStatus: 1 });
BusinessUserSchema.index({ isActive: 1, isPremium: 1 });

// ====================== MODEL ======================
export const BusinessUser = mongoose.model<IBusinessUser>(
  "BusinessUser",
  BusinessUserSchema
);
