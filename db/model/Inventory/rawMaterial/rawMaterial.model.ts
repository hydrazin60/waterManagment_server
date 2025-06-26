import mongoose, { Document, Schema, Types } from "mongoose";

// ====================== INTERFACES ======================
interface IQualityTest {
  testName: string;
  testDate: Date;
  testResult: string;
  testStandard: string;
  conductedBy: string;
  notes?: string;
}

interface IBatch {
  batchNumber: string;
  manufacturingDate: Date;
  expiryDate: Date;
  quantity: number;
  unit: string;
  qualityTests: IQualityTest[];
  supplierBatchNumber?: string;
  storageConditions: {
    temperature?: string;
    humidity?: string;
    lightExposure?: string;
  };
}

interface ISupplierInfo {
  supplier: Types.ObjectId; // Reference to Supplier or Company
  supplierModel: "Supplier" | "Company";
  materialType: string;
  leadTime: number; // in days
  minimumOrderQuantity: number;
  unit: string;
  contractTerms?: string;
  lastOrderDate?: Date;
  averageRating?: number;
}

// ====================== RAW MATERIAL SCHEMA ======================
export interface IRawMaterial extends Document {
  // Basic Information
  name: string;
  description: string;
  materialCode: string;
  category: "water" | "chemical" | "packaging" | "other";
  type: string; // e.g., "mineral", "spring", "RO" for water; "PET", "bottle cap" for packaging
  unit: string; // e.g., "liter", "kg", "piece"
  isHazardous: boolean;
  safetyDataSheet?: string;

  // Inventory Information
  currentStock: number;
  minimumStockLevel: number;
  maximumStockLevel?: number;
  reorderPoint: number;
  batches: IBatch[];
  lastRestocked: Date;
  shelfLife?: number; // in days

  // Water-Specific Properties (if category is "water")
  sourceType?: "natural" | "processed";
  phLevel?: number;
  tdsLevel?: number; // Total Dissolved Solids in ppm
  turbidity?: number; // in NTU
  mineralContent?: {
    calcium?: number;
    magnesium?: number;
    sodium?: number;
    potassium?: number;
  };

  // Supplier Information
  primarySupplier: ISupplierInfo;
  alternateSuppliers: ISupplierInfo[];
  procurementCost: number;
  currency: string;

  // Quality Control
  qualityStandards: string[];
  requiredCertifications: string[];
  qualityTests: IQualityTest[];
  rejectionRate?: number; // percentage

  // Usage Tracking
  usedInProducts: Types.ObjectId[]; // Reference to finished products
  averageMonthlyUsage?: number;
  lastUsedDate?: Date;

  // Storage Information
  storageLocation: Types.ObjectId; // Reference to warehouse location
  storageRequirements: {
    temperature?: string;
    humidity?: string;
    specialConditions?: string;
  };

  // Status
  isActive: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
  approvalNotes?: string;

  // Metadata
  company: Types.ObjectId; // Reference to Company
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId; // Reference to BusinessUser
}

// ====================== SUB-SCHEMAS ======================
const QualityTestSchema = new Schema<IQualityTest>({
  testName: { type: String, required: true },
  testDate: { type: Date, required: true },
  testResult: { type: String, required: true },
  testStandard: { type: String, required: true },
  conductedBy: { type: String, required: true },
  notes: { type: String },
});

const BatchSchema = new Schema<IBatch>({
  batchNumber: { type: String, required: true },
  manufacturingDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  qualityTests: [QualityTestSchema],
  supplierBatchNumber: { type: String },
  storageConditions: {
    temperature: { type: String },
    humidity: { type: String },
    lightExposure: { type: String },
  },
});

const SupplierInfoSchema = new Schema<ISupplierInfo>({
  supplier: {
    type: Schema.Types.ObjectId,
    refPath: "primarySupplier.supplierModel",
    required: true,
  },
  supplierModel: {
    type: String,
    required: true,
    enum: ["Supplier", "Company"],
  },
  materialType: { type: String, required: true },
  leadTime: { type: Number, required: true }, // in days
  minimumOrderQuantity: { type: Number, required: true },
  unit: { type: String, required: true },
  contractTerms: { type: String },
  lastOrderDate: { type: Date },
  averageRating: { type: Number, min: 1, max: 5 },
});

const MineralContentSchema = new Schema({
  calcium: { type: Number },
  magnesium: { type: Number },
  sodium: { type: Number },
  potassium: { type: Number },
});

// ====================== MAIN SCHEMA ======================
const RawMaterialSchema = new Schema<IRawMaterial>(
  {
    // Basic Information
    name: { type: String, required: true },
    description: { type: String, required: true },
    materialCode: { type: String, required: true, unique: true },
    category: {
      type: String,
      required: true,
      enum: ["water", "chemical", "packaging", "other"],
    },
    type: { type: String, required: true },
    unit: { type: String, required: true },
    isHazardous: { type: Boolean, default: false },
    safetyDataSheet: { type: String },

    // Inventory Information
    currentStock: { type: Number, default: 0 },
    minimumStockLevel: { type: Number, required: true },
    maximumStockLevel: { type: Number },
    reorderPoint: { type: Number, required: true },
    batches: [BatchSchema],
    lastRestocked: { type: Date },
    shelfLife: { type: Number }, // in days

    // Water-Specific Properties
    sourceType: { type: String, enum: ["natural", "processed"] },
    phLevel: { type: Number },
    tdsLevel: { type: Number }, // Total Dissolved Solids in ppm
    turbidity: { type: Number }, // in NTU
    mineralContent: { type: MineralContentSchema },

    // Supplier Information
    primarySupplier: { type: SupplierInfoSchema, required: true },
    alternateSuppliers: [SupplierInfoSchema],
    procurementCost: { type: Number, required: true },
    currency: { type: String, default: "NPR" },

    // Quality Control
    qualityStandards: [{ type: String }],
    requiredCertifications: [{ type: String }],
    qualityTests: [QualityTestSchema],
    rejectionRate: { type: Number }, // percentage

    // Usage Tracking
    usedInProducts: [{ type: Schema.Types.ObjectId, ref: "InventoryItem" }],
    averageMonthlyUsage: { type: Number },
    lastUsedDate: { type: Date },

    // Storage Information
    storageLocation: {
      type: Schema.Types.ObjectId,
      ref: "WarehouseLocation",
      required: true,
    },
    storageRequirements: {
      temperature: { type: String },
      humidity: { type: String },
      specialConditions: { type: String },
    },

    // Status
    isActive: { type: Boolean, default: true },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvalNotes: { type: String },

    // Metadata
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },
  },
  { timestamps: true }
);

// ====================== INDEXES ======================
RawMaterialSchema.index({ name: 1, company: 1 }, { unique: true });
RawMaterialSchema.index({ materialCode: 1 }, { unique: true });
RawMaterialSchema.index({ category: 1, type: 1 });
RawMaterialSchema.index({ currentStock: 1 });
RawMaterialSchema.index({ "primarySupplier.supplier": 1 });
RawMaterialSchema.index({ isActive: 1, approvalStatus: 1 });

// ====================== MODEL ======================
export const RawMaterial = mongoose.model<IRawMaterial>(
  "RawMaterial",
  RawMaterialSchema
);