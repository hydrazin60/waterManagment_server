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
  branchName?: string;
  accountHolderName: string;
  bankQRCode?: string;
  eSewaID?: string;
  eSewaQRCode?: string;
  khaltiID?: string;
  khaltiQRCode?: string;
}

interface IIdentityDocuments {
  taxIdentificationNumber?: string;
  vatNumber?: string;
  registrationNumber?: string;
  registrationCertificate?: string;
  panNumber: string;
  panPhoto?: string;
  taxClearanceCertificate?: string;
  vatRegistrationCertificate?: string;
}

interface ISupplierSimple {
  _id: Types.ObjectId;
  name: string;
}

interface ICustomerSimple {
  _id: Types.ObjectId;
  name: string;
}

// ====================== COMPANY SCHEMA ======================
export interface ICompany extends Document {
  // Basic Company Info
  companyName: string;
  legalName: string;
  companyType:
    | "supplier"
    | "manufacturer"
    | "distributor"
    | "retailer"
    | "service";
  industry: "water" | "other";
  companyLogo?: string;
  companyWebsite?: string;
  companyDescription?: string;
  foundingDate?: Date;

  // Business Registration

  identityDocuments: IIdentityDocuments;

  // Contact Information
  primaryEmail: string;
  primaryPhone: string;
  secondaryPhone?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };

  // Addresses
  operationalAddress: IAddress[];
  warehouseLocations?: IAddress[];

  // Financial Information
  bankDetails: IBankDetails[];
  paymentMethods: string[];

  // Business Relationships
  suppliers: ISupplierSimple[];
  customers: ICustomerSimple[];

  // References to other collections
  employees: Types.ObjectId[]; // Reference to Employee model
  purchaseOrders: Types.ObjectId[]; // Reference to PurchaseOrder model
  salesOrders: Types.ObjectId[]; // Reference to SalesOrder model
  purchaseInvoices: Types.ObjectId[]; // Reference to PurchaseInvoice model
  salesInvoices: Types.ObjectId[]; // Reference to SalesInvoice model
  expenseInvoices: Types.ObjectId[]; // Reference to ExpenseInvoice model
  rawMaterials: Types.ObjectId[]; // Reference to InventoryItem model (type: rawMaterial)
  finishedProducts: Types.ObjectId[]; // Reference to InventoryItem model (type: finishedProduct)
  branches: Types.ObjectId[]; // Reference to Branch model

  // Business Operations
  operatingHours?: {
    days: string[];
    openingTime: string;
    closingTime: string;
  };
  deliveryRadius?: number; // in km
  deliveryFee?: number;
  serviceAreas: string[];

  // Status & Verification
  isVerified: boolean;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  verificationNotes?: string;
  isActive: boolean;
  isPremium: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId; // Reference to BusinessUser
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
  branchName: { type: String },
  accountHolderName: { type: String, required: true },
  bankQRCode: { type: String },
  eSewaID: { type: String },
  eSewaQRCode: { type: String },
  khaltiID: { type: String },
  khaltiQRCode: { type: String },
});

const IdentityDocumentsSchema = new Schema<IIdentityDocuments>({
  taxIdentificationNumber: { type: String },
  vatNumber: { type: String },
  registrationNumber: { type: String },
  registrationCertificate: { type: String },
  panNumber: { type: String, required: true },
  panPhoto: { type: String },
  taxClearanceCertificate: { type: String },
  vatRegistrationCertificate: { type: String },
});

const SupplierSimpleSchema = new Schema<ISupplierSimple>({
  _id: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
});

const CustomerSimpleSchema = new Schema<ICustomerSimple>({
  _id: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
});

// ====================== MAIN SCHEMA ======================
const CompanySchema = new Schema<ICompany>(
  {
    // Basic Company Info
    companyName: { type: String, required: true },
    legalName: { type: String, required: true },
    companyType: {
      type: String,
      required: true,
      enum: ["supplier", "manufacturer", "distributor", "retailer", "service"],
    },
    industry: {
      type: String,
      required: true,
      enum: ["water", "other"],
    },
    companyLogo: { type: String },
    companyWebsite: { type: String },
    companyDescription: { type: String },
    foundingDate: { type: Date },

    // Business Registration

    identityDocuments: { type: IdentityDocumentsSchema, required: true },

    // Contact Information
    primaryEmail: { type: String, required: true },
    primaryPhone: { type: String, required: true },
    secondaryPhone: { type: String },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },

    // Addresses
    operationalAddress: { type: [AddressSchema], required: true },
    warehouseLocations: [AddressSchema],

    // Financial Information
    bankDetails: { type: [BankDetailsSchema], required: true },
    paymentMethods: [{ type: String, required: true }],

    // Business Relationships
    suppliers: { type: [SupplierSimpleSchema], default: [] },
    customers: { type: [CustomerSimpleSchema], default: [] },

    // References to other collections
    employees: [{ type: Schema.Types.ObjectId, ref: "Employee" }],
    purchaseOrders: [{ type: Schema.Types.ObjectId, ref: "PurchaseOrder" }],
    salesOrders: [{ type: Schema.Types.ObjectId, ref: "SalesOrder" }],
    purchaseInvoices: [{ type: Schema.Types.ObjectId, ref: "PurchaseInvoice" }],
    salesInvoices: [{ type: Schema.Types.ObjectId, ref: "SalesInvoice" }],
    expenseInvoices: [{ type: Schema.Types.ObjectId, ref: "ExpenseInvoice" }],
    rawMaterials: [{ type: Schema.Types.ObjectId, ref: "InventoryItem" }],
    finishedProducts: [{ type: Schema.Types.ObjectId, ref: "InventoryItem" }],
    branches: [{ type: Schema.Types.ObjectId, ref: "Branch" }],

    // Business Operations
    operatingHours: {
      days: [{ type: String }],
      openingTime: { type: String, default: "08:00" },
      closingTime: { type: String, default: "17:00" },
    },
    deliveryRadius: { type: Number },
    deliveryFee: { type: Number },
    serviceAreas: [{ type: String }],

    // Status & Verification
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    verificationNotes: { type: String },
    isActive: { type: Boolean, default: true },
    isPremium: { type: Boolean, default: false },

    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },
  },
  { timestamps: true }
);

// ====================== INDEXES ======================
CompanySchema.index({ companyName: 1 }, { unique: true });
CompanySchema.index({ taxIdentificationNumber: 1 }, { unique: true });
CompanySchema.index({ companyType: 1, industry: 1 });
CompanySchema.index({ "operationalAddress.district": 1 });
CompanySchema.index({ verificationStatus: 1 });
CompanySchema.index({ isActive: 1, isPremium: 1 });

// ====================== MODEL ======================
export const Company = mongoose.model<ICompany>("Company", CompanySchema);
