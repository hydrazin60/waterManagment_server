import mongoose, { Document, Schema, Types } from "mongoose";

// ====================== INTERFACES ======================
interface IAddress {
  country: string;
  province: string;
  district: string;
  municipality?: string;
  city?: string;
  tole?: string;
  nearFamousPlace?: string;
  zip?: string;
  coordinates?: [number, number]; // [longitude, latitude]
}

interface IContact {
  phone: string;
  email?: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
}

interface IOperatingHours {
  days: string[]; // ["Monday", "Tuesday", ...]
  openingTime: string; // "09:00"
  closingTime: string; // "18:00"
  is24Hours?: boolean;
}

interface IStorageLocation {
  name: string;
  type: "warehouse" | "coldStorage" | "dispensary";
  capacity?: number; // in liters or units
  currentStock?: number;
}

// ====================== BRANCH SCHEMA ======================
export interface IBranch extends Document {
  // **Basic Branch Info**
  branchName: string;
  branchCode: string; // Unique identifier (e.g., "WF-KTM-01")
  description?: string;
  branchType: "retail" | "distribution" | "production" | "headOffice";
  isActive: boolean;

  // **Contact Information**
  contact: IContact;
  branchManager?: Types.ObjectId; // Reference to Worker

  // **Location & Address**
  address: IAddress;
  operatingHours?: IOperatingHours;
  deliveryRadius?: number; // in km (for local deliveries)
  serviceAreas?: string[]; // ["Kathmandu", "Lalitpur"]

  // **Company Reference**
  company: Types.ObjectId; // Reference to Company

  // **Staff & Workers**
  staff: Types.ObjectId[]; // Reference to Worker[]
  assignedDrivers?: Types.ObjectId[]; // Reference to Worker[]

  // **Inventory & Products**
  rawMaterials: Types.ObjectId[]; // Reference to RawMaterial[]
  finishedProducts: Types.ObjectId[]; // Reference to FinishedProduct[]
  storageLocations?: IStorageLocation[];

  // **Suppliers & Purchases**
  suppliers: Types.ObjectId[]; // Reference to Supplier[]
  purchaseInvoices: Types.ObjectId[]; // Reference to PurchaseInvoice[]

  // **Sales & Orders**
  salesInvoices: Types.ObjectId[]; // Reference to SalesInvoice[]
  pendingOrders: Types.ObjectId[]; // Reference to Order[]
  completedOrders: Types.ObjectId[]; // Reference to Order[]

  // **Vehicles & Logistics**
  assignedVehicles: Types.ObjectId[]; // Reference to Vehicle[]
  deliverySchedules?: {
    day: string;
    timeSlots: string[];
  }[];

  // **Financial Tracking**
  dailySales?: number;
  monthlyTarget?: number;
  expenseInvoices: Types.ObjectId[]; // Reference to ExpenseInvoice[]

  // **Branch Security & Access**
  branchPassword?: string; // For admin access
  resetPasswordToken?: string;
  accessPermissions?: {
    inventoryManagement: boolean;
    salesAccess: boolean;
    purchaseApproval: boolean;
  };

  // **Images & Branding**
  branchLogo?: {
    public_id: string;
    url: string;
  };
  branchImages?: {
    public_id: string;
    url: string;
    caption?: string;
  }[];

  // **Metadata**
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId; // Reference to BusinessUser
}

// ====================== SUB-SCHEMAS ======================
const AddressSchema = new Schema<IAddress>({
  country: { type: String, default: "Nepal" },
  province: { type: String, required: true },
  district: { type: String, required: true },
  municipality: { type: String },
  city: { type: String },
  tole: { type: String },
  nearFamousPlace: { type: String },
  zip: { type: String },
  coordinates: { type: [Number] }, // [longitude, latitude]
});

const ContactSchema = new Schema<IContact>({
  phone: { type: String, required: true },
  email: { type: String },
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
  },
});

const OperatingHoursSchema = new Schema<IOperatingHours>({
  days: [{ type: String }],
  openingTime: { type: String , default: "08:00"},
  closingTime: { type: String  , default: "17:00"},
  is24Hours: { type: Boolean, default: false },
});

const StorageLocationSchema = new Schema<IStorageLocation>({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["warehouse", "coldStorage", "dispensary"],
    required: true,
  },
  capacity: { type: Number },
  currentStock: { type: Number },
});

// ====================== MAIN SCHEMA ======================
const BranchSchema = new Schema<IBranch>(
  {
    // **Basic Branch Info**
    branchName: { type: String, required: true, unique: true },
    branchCode: { type: String, required: true, unique: true },
    description: { type: String, default: "Water Factory Branch" },
    branchType: {
      type: String,
      enum: ["retail", "distribution", "production", "headOffice"],
      default: "retail",
    },
    isActive: { type: Boolean, default: true },

    // **Contact Information**
    contact: { type: ContactSchema, required: true },
    branchManager: { type: Schema.Types.ObjectId, ref: "Worker" },

    // **Location & Address**
    address: { type: AddressSchema, required: true },
    operatingHours: { type: OperatingHoursSchema },
    deliveryRadius: { type: Number }, // in km
    serviceAreas: [{ type: String }],

    // **Company Reference**
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // **Staff & Workers**
    staff: [{ type: Schema.Types.ObjectId, ref: "Worker" }],
    assignedDrivers: [{ type: Schema.Types.ObjectId, ref: "Worker" }],

    // **Inventory & Products**
    rawMaterials: [{ type: Schema.Types.ObjectId, ref: "RawMaterial" }],
    finishedProducts: [{ type: Schema.Types.ObjectId, ref: "FinishedProduct" }],
    storageLocations: [StorageLocationSchema],

    // **Suppliers & Purchases**
    suppliers: [{ type: Schema.Types.ObjectId, ref: "Supplier" }],
    purchaseInvoices: [{ type: Schema.Types.ObjectId, ref: "PurchaseInvoice" }],

    // **Sales & Orders**
    salesInvoices: [{ type: Schema.Types.ObjectId, ref: "SalesInvoice" }],
    pendingOrders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    completedOrders: [{ type: Schema.Types.ObjectId, ref: "Order" }],

    // **Vehicles & Logistics**
    assignedVehicles: [{ type: Schema.Types.ObjectId, ref: "Vehicle" }],
    deliverySchedules: [
      {
        day: { type: String },
        timeSlots: [{ type: String }],
      },
    ],

    // **Financial Tracking**
    dailySales: { type: Number, default: 0 },
    monthlyTarget: { type: Number },
    expenseInvoices: [{ type: Schema.Types.ObjectId, ref: "ExpenseInvoice" }],

    // **Branch Security & Access**
    branchPassword: { type: String },
    resetPasswordToken: { type: String },
    accessPermissions: {
      inventoryManagement: { type: Boolean, default: false },
      salesAccess: { type: Boolean, default: true },
      purchaseApproval: { type: Boolean, default: false },
    },

    // **Images & Branding**
    branchLogo: {
      public_id: { type: String },
      url: { type: String },
    },
    branchImages: [
      {
        public_id: { type: String },
        url: { type: String },
        caption: { type: String },
      },
    ],

    // **Metadata**
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },
  },
  { timestamps: true }
);

// ====================== INDEXES ======================
BranchSchema.index({ branchName: 1 }, { unique: true });
BranchSchema.index({ branchCode: 1 }, { unique: true });
BranchSchema.index({ company: 1 });
BranchSchema.index({ "address.district": 1 });
BranchSchema.index({ branchType: 1 });
BranchSchema.index({ isActive: 1 });

// ====================== MODEL ======================
export const Branch = mongoose.model<IBranch>("Branch", BranchSchema);
