import mongoose, { Document, Schema, Types } from "mongoose";

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

interface IEmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

interface IOperatingHours {
  days: string[];
  openingTime: string;
  closingTime: string;
}

export interface ICompany extends Document {
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
  owners: Types.ObjectId[];
  ownerModel: "Admin" | "BusinessUser";
  identityDocuments: IIdentityDocuments;
  primaryEmail: string;
  primaryPhone: string;
  secondaryPhone?: string;
  emergencyContact?: IEmergencyContact;
  operationalAddress: IAddress[];
  warehouseLocations?: IAddress[];
  bankDetails: IBankDetails[];
  paymentMethods: string[];
  suppliers: ISupplierSimple[];
  customers: ICustomerSimple[];
  employees: Types.ObjectId[];
  purchaseOrders: Types.ObjectId[];
  salesOrders: Types.ObjectId[];
  purchaseInvoices: Types.ObjectId[];
  salesInvoices: Types.ObjectId[];
  expenseInvoices: Types.ObjectId[];
  rawMaterials: Types.ObjectId[];
  finishedProducts: Types.ObjectId[];
  branches: Types.ObjectId[];
  operatingHours?: IOperatingHours;
  deliveryRadius?: number;
  deliveryFee?: number;
  serviceAreas: string[];
  isVerified: boolean;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  verificationNotes?: string;
  isActive: boolean;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId;
}

const AddressSchema = new Schema<IAddress>({
  district: { type: String, required: true },
  municipality: { type: String },
  city: { type: String },
  tole: { type: String },
  nearFamousPlace: { type: String },
  country: { type: String, default: "Nepal" },
  province: { type: String, required: true },
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

const EmergencyContactSchema = new Schema<IEmergencyContact>({
  name: { type: String, },
  phone: { type: String, },
  relation: { type: String, },
});

const OperatingHoursSchema = new Schema<IOperatingHours>({
  days: { type: [String], required: true },
  openingTime: { type: String, default: "08:00" },
  closingTime: { type: String, default: "17:00" },
});

const CompanySchema = new Schema<ICompany>(
  {
    companyName: { type: String, required: true, unique: true },
    legalName: { type: String, required: true },
    companyType: {
      type: String,
      default: "manufacturer",
      enum: ["supplier", "manufacturer", "distributor", "retailer", "service"],
    },
    industry: {
      type: String,
      default: "water",
      enum: ["water", "other"],
    },
    companyLogo: { type: String },
    companyWebsite: { type: String },
    companyDescription: { type: String },
    foundingDate: { type: Date },
    owners: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: "ownerModel",
      },
    ],
    ownerModel: {
      type: String,
      required: true,
      enum: ["Admin", "BusinessUser"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "ownerModel",
    },
    identityDocuments: { type: IdentityDocumentsSchema },
    primaryEmail: { type: String, required: true },
    primaryPhone: { type: String, required: true },
    secondaryPhone: { type: String },
    emergencyContact: { type: EmergencyContactSchema },
    operationalAddress: { type: [AddressSchema], required: true },
    warehouseLocations: { type: [AddressSchema] },
    bankDetails: { type: [BankDetailsSchema] },
    paymentMethods: { type: [String], required: true },
    suppliers: { type: [SupplierSimpleSchema], default: [] },
    customers: { type: [CustomerSimpleSchema], default: [] },
    employees: [{ type: Schema.Types.ObjectId, ref: "Employee" }],
    purchaseOrders: [{ type: Schema.Types.ObjectId, ref: "PurchaseOrder" }],
    salesOrders: [{ type: Schema.Types.ObjectId, ref: "SalesOrder" }],
    purchaseInvoices: [{ type: Schema.Types.ObjectId, ref: "PurchaseInvoice" }],
    salesInvoices: [{ type: Schema.Types.ObjectId, ref: "SalesInvoice" }],
    expenseInvoices: [{ type: Schema.Types.ObjectId, ref: "ExpenseInvoice" }],
    rawMaterials: [{ type: Schema.Types.ObjectId, ref: "InventoryItem" }],
    finishedProducts: [{ type: Schema.Types.ObjectId, ref: "InventoryItem" }],
    branches: [{ type: Schema.Types.ObjectId, ref: "Branch" }],
    operatingHours: { type: OperatingHoursSchema },
    deliveryRadius: { type: Number },
    deliveryFee: { type: Number },
    serviceAreas: { type: [String] },
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    verificationNotes: { type: String },
    isActive: { type: Boolean, default: true },
    isPremium: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        delete ret.identityDocuments;
        delete ret.bankDetails;
      },
    },
  }
);

// Middleware to handle bidirectional relationship
CompanySchema.post("save", async function (doc) {
  const OwnerModel = mongoose.model(doc.ownerModel);
  await OwnerModel.updateMany(
    { _id: { $in: doc.owners } },
    { $addToSet: { companies: doc._id } }
  );
});

// Indexes
CompanySchema.index({ companyName: 1 }, { unique: true });
CompanySchema.index({ owners: 1, ownerModel: 1 });
CompanySchema.index({ companyType: 1, industry: 1 });
CompanySchema.index({ "operationalAddress.district": 1 });
CompanySchema.index({ verificationStatus: 1 });
CompanySchema.index({ isActive: 1, isPremium: 1 });

// Virtuals
CompanySchema.virtual("ownersList", {
  ref: function () {
    return this.ownerModel;
  },
  localField: "owners",
  foreignField: "_id",
  justOne: false,
});

export const Company = mongoose.model<ICompany>("Company", CompanySchema);
