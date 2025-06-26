import mongoose, { Document, Schema, Types } from "mongoose";

// ====================== INTERFACES ======================
interface IProductVariant {
  capacity: number; // in liters or ml
  unit: string; // "ml", "L", "gallon"
  packagingType: "bottle" | "jar" | "can" | "pouch" | "dispenser";
  material: "PET" | "glass" | "aluminum" | "HDPE" | "other";
  color?: string;
  barcode: string;
  sku: string;
  image?: string;
  weight?: number; // in grams
  dimensions?: {
    height: number;
    diameter?: number;
    length?: number;
    width?: number;
  };
}

interface IProductionBatch {
  batchNumber: string;
  productionDate: Date;
  expiryDate: Date;
  quantity: number;
  operator: string;
  machineUsed?: string;
  qualityTests: {
    testName: string;
    testDate: Date;
    testResult: string;
    standard: string;
    passed: boolean;
  }[];
}

interface IWaterSpecifications {
  waterSource: "spring" | "mineral" | "purified" | "alkaline";
  treatmentProcess: string[];
  phLevel: number;
  tdsLevel: number; // Total Dissolved Solids in ppm
  mineralContent?: {
    calcium?: number;
    magnesium?: number;
    sodium?: number;
    potassium?: number;
  };
  certifications: string[]; // e.g., "ISO", "FDA", "HACCP"
}

interface IPricing {
  basePrice: number;
  wholesalePrice?: number;
  retailPrice: number;
  discountPrice?: number;
  currency: string;
  taxRate: number;
}

// ====================== FINISHED PRODUCT SCHEMA ======================
export interface IFinishedProduct extends Document {
  // Basic Product Information
  productName: string;
  productCode: string;
  description: string;
  brand: Types.ObjectId; // Reference to Company
  category: "drinking" | "mineral" | "sparkling" | "flavored" | "medicinal";
  productType: "water" | "beverage" | "other";
  variants: IProductVariant[];
  defaultVariant: number; // index of default variant in variants array

  // Water Specifications
  waterSpecifications: IWaterSpecifications;

  // Production Information
  rawMaterials: Array<{
    material: Types.ObjectId; // Reference to RawMaterial
    quantity: number;
    unit: string;
  }>;
  productionProcess: string[];
  shelfLife: number; // in days
  storageConditions: {
    temperature: string;
    humidity?: string;
    lightExposure?: string;
  };

  // Inventory & Batch Management
  currentStock: number;
  batches: IProductionBatch[];
  minimumStockLevel: number;
  reorderQuantity: number;

  // Pricing & Sales
  pricing: IPricing;
  targetMarkets: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewProduct: boolean;

  // Quality & Compliance
  qualityStandards: string[];
  requiredCertifications: string[];
  recallHistory?: {
    date: Date;
    reason: string;
    affectedBatches: string[];
    actionsTaken: string;
  }[];

  // Marketing
  marketingImages: string[];
  promotionalMaterials?: string[];
  nutritionalInfo?: string;
  healthClaims?: string[];

  // Status
  isActive: boolean;
  approvalStatus: "draft" | "pending" | "approved" | "discontinued";
  approvalNotes?: string;

  // Metadata
  company: Types.ObjectId; // Reference to Company
  branch: Types.ObjectId; // Reference to Branch
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId; // Reference to BusinessUser
}

// ====================== SUB-SCHEMAS ======================
const ProductVariantSchema = new Schema<IProductVariant>({
  capacity: { type: Number, required: true },
  unit: { type: String, required: true, enum: ["ml", "L", "gallon"] },
  packagingType: {
    type: String,
    required: true,
    enum: ["bottle", "jar", "can", "pouch", "dispenser"],
  },
  material: {
    type: String,
    required: true,
    enum: ["PET", "glass", "aluminum", "HDPE", "other"],
  },
  color: { type: String },
  barcode: { type: String, required: true, unique: true },
  sku: { type: String, required: true, unique: true },
  image: { type: String },
  weight: { type: Number },
  dimensions: {
    height: { type: Number },
    diameter: { type: Number },
    length: { type: Number },
    width: { type: Number },
  },
});

const ProductionBatchSchema = new Schema<IProductionBatch>({
  batchNumber: { type: String, required: true },
  productionDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  quantity: { type: Number, required: true },
  operator: { type: String, required: true },
  machineUsed: { type: String },
  qualityTests: [
    {
      testName: { type: String, required: true },
      testDate: { type: Date, required: true },
      testResult: { type: String, required: true },
      standard: { type: String, required: true },
      passed: { type: Boolean, required: true },
    },
  ],
});

const WaterSpecificationsSchema = new Schema<IWaterSpecifications>({
  waterSource: {
    type: String,
    required: true,
    enum: ["spring", "mineral", "purified", "alkaline"],
  },
  treatmentProcess: [{ type: String }],
  phLevel: { type: Number, required: true },
  tdsLevel: { type: Number, required: true },
  mineralContent: {
    calcium: { type: Number },
    magnesium: { type: Number },
    sodium: { type: Number },
    potassium: { type: Number },
  },
  certifications: [{ type: String }],
});

const PricingSchema = new Schema<IPricing>({
  basePrice: { type: Number, required: true },
  wholesalePrice: { type: Number },
  retailPrice: { type: Number, required: true },
  discountPrice: { type: Number },
  currency: { type: String, default: "NPR" },
  taxRate: { type: Number, default: 13 }, // VAT in Nepal
});

const RawMaterialUsageSchema = new Schema({
  material: {
    type: Schema.Types.ObjectId,
    ref: "RawMaterial",
    required: true,
  },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
});

const RecallHistorySchema = new Schema({
  date: { type: Date, required: true },
  reason: { type: String, required: true },
  affectedBatches: [{ type: String }],
  actionsTaken: { type: String, required: true },
});

// ====================== MAIN SCHEMA ======================
const FinishedProductSchema = new Schema<IFinishedProduct>(
  {
    // Basic Product Information
    productName: { type: String, required: true },
    productCode: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["drinking", "mineral", "sparkling", "flavored", "medicinal"],
    },
    productType: {
      type: String,
      required: true,
      enum: ["water", "beverage", "other"],
    },
    variants: [ProductVariantSchema],
    defaultVariant: { type: Number, default: 0 },

    // Water Specifications
    waterSpecifications: { type: WaterSpecificationsSchema, required: true },

    // Production Information
    rawMaterials: [RawMaterialUsageSchema],
    productionProcess: [{ type: String }],
    shelfLife: { type: Number, required: true }, // in days
    storageConditions: {
      temperature: { type: String, required: true },
      humidity: { type: String },
      lightExposure: { type: String },
    },

    // Inventory & Batch Management
    currentStock: { type: Number, default: 0 },
    batches: [ProductionBatchSchema],
    minimumStockLevel: { type: Number, required: true },
    reorderQuantity: { type: Number, required: true },

    // Pricing & Sales
    pricing: { type: PricingSchema, required: true },
    targetMarkets: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewProduct: { type: Boolean, default: true },

    // Quality & Compliance
    qualityStandards: [{ type: String }],
    requiredCertifications: [{ type: String }],
    recallHistory: [RecallHistorySchema],

    // Marketing
    marketingImages: [{ type: String }],
    promotionalMaterials: [{ type: String }],
    nutritionalInfo: { type: String },
    healthClaims: [{ type: String }],

    // Status
    isActive: { type: Boolean, default: true },
    approvalStatus: {
      type: String,
      enum: ["draft", "pending", "approved", "discontinued"],
      default: "draft",
    },
    approvalNotes: { type: String },

    // Metadata
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
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
FinishedProductSchema.index({ productName: 1, company: 1 }, { unique: true });
FinishedProductSchema.index({ productCode: 1 }, { unique: true });
FinishedProductSchema.index({ "variants.sku": 1 }, { unique: true });
FinishedProductSchema.index({ "variants.barcode": 1 }, { unique: true });
FinishedProductSchema.index({ category: 1, productType: 1 });
FinishedProductSchema.index({ "waterSpecifications.waterSource": 1 });
FinishedProductSchema.index({ isActive: 1, approvalStatus: 1 });
FinishedProductSchema.index({ isFeatured: 1, isBestSeller: 1 });

// ====================== MODEL ======================
export const FinishedProduct = mongoose.model<IFinishedProduct>(
  "FinishedProduct",
  FinishedProductSchema
);
